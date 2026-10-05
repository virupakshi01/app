import { Request, Response } from "express";
import { Repository } from "../models/Repository";
import { WebhookEvent } from "../models/WebhookEvent";
import { Job } from "../models/Job";
import { logger } from "../logger";
import { verifyGithubSignature } from "../github/webhookVerify";

const SUPPORTED_EVENTS = new Set(["issues", "pull_request", "push"]);

export async function handleGithubWebhook(req: Request, res: Response): Promise<void> {
  const rawBody = req.body as Buffer;
  const deliveryId = req.header("X-GitHub-Delivery");
  const eventType = req.header("X-GitHub-Event");
  const signature = req.header("X-Hub-Signature-256");

  if (!deliveryId || !eventType) {
    res.status(400).json({ error: "Missing GitHub delivery headers" });
    return;
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  const githubRepoId = String(payload?.repository?.id ?? "");
  const repository = githubRepoId ? await Repository.findOne({ githubRepoId }) : null;

  if (!repository) {
    res.status(404).json({ error: "Repository not connected" });
    return;
  }

  const validSignature = verifyGithubSignature(rawBody, signature ?? undefined, repository.webhookSecret);
  if (!validSignature) {
    logger.warn({ deliveryId, repo: repository.fullName }, "Rejected webhook with invalid signature");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  if (!SUPPORTED_EVENTS.has(eventType)) {
    // Acknowledge but don't persist/process events we don't act on.
    res.status(202).json({ status: "ignored" });
    return;
  }

  const existing = await WebhookEvent.findOne({ deliveryId });
  if (existing) {
    // Same delivery redelivered by GitHub: idempotent no-op.
    res.status(202).json({ status: "duplicate" });
    return;
  }

  const webhookEvent = await WebhookEvent.create({
    deliveryId,
    repositoryId: repository.id,
    eventType,
    action: payload.action ?? null,
    payload,
    status: "RECEIVED",
  });

  await Job.create({ webhookEventId: webhookEvent.id });

  res.status(202).json({ status: "accepted", webhookEventId: webhookEvent.id });
}
