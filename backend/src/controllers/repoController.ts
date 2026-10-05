import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { Repository } from "../models/Repository";
import { connectRepository, getConnectableRepositories } from "../services/githubService";
import { logger } from "../logger";

export async function listRepositories(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id);
  if (!user) throw new Error("Authenticated user not found");

  const connected = await Repository.find({ ownerId: user.id });
  const connectedIds = new Set(connected.map((r) => r.githubRepoId));

  try {
    const available = await getConnectableRepositories(user.accessToken);
    res.json({
      repositories: available.map((r) => ({
        ...r,
        connected: connectedIds.has(r.githubRepoId),
      })),
    });
  } catch (err) {
    logger.error({ err }, "Failed to list GitHub repositories");
    res.status(502).json({ error: "Failed to fetch repositories from GitHub" });
  }
}

const connectSchema = z.object({
  githubRepoId: z.string().min(1),
  fullName: z.string().min(3),
});

export async function connectRepositoryHandler(req: Request, res: Response): Promise<void> {
  const parsed = connectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const user = await User.findById(req.user!.id);
  if (!user) throw new Error("Authenticated user not found");

  try {
    const repository = await connectRepository({
      ownerId: user.id,
      accessToken: user.accessToken,
      githubRepoId: parsed.data.githubRepoId,
      fullName: parsed.data.fullName,
    });
    res.status(201).json({ repository: { id: repository.id, fullName: repository.fullName } });
  } catch (err) {
    logger.error({ err }, "Failed to connect repository");

    const message = err instanceof Error ? err.message : "Failed to register webhook with GitHub";
    const status = message.toLowerCase().includes("public https url") || message.toLowerCase().includes("localhost") ? 400 : 502;

    res.status(status).json({
      error: message,
    });
  }
}

export async function listConnectedRepositories(req: Request, res: Response): Promise<void> {
  const repositories = await Repository.find({ ownerId: req.user!.id }).sort({ createdAt: -1 });
  res.json({
    repositories: repositories.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      isActive: r.isActive,
      createdAt: r.createdAt,
    })),
  });
}
