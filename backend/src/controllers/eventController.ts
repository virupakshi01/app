import { Request, Response } from "express";
import { Types } from "mongoose";
import { Repository } from "../models/Repository";
import { WebhookEvent } from "../models/WebhookEvent";
import { Job } from "../models/Job";
import { ActionLog } from "../models/ActionLog";

async function ownedRepositoryIds(userId: string): Promise<string[]> {
  const repos = await Repository.find({ ownerId: userId }).select("_id");
  return repos.map((r) => r.id);
}

export async function listEvents(req: Request, res: Response): Promise<void> {
  const repoIds = await ownedRepositoryIds(req.user!.id);
  const { repositoryId, status } = req.query as { repositoryId?: string; status?: string };
  // Intersect with the caller's own repos so a repositoryId for someone
  // else's repo can't be used to read their events.
  const allowedIds = repositoryId ? repoIds.filter((id) => id === repositoryId) : repoIds;

  const events = await WebhookEvent.find({
    repositoryId: { $in: allowedIds },
    ...(status ? { status } : {}),
  })
    .populate("repositoryId")
    .sort({ receivedAt: -1 })
    .limit(100);

  res.json({
    events: events.map((e) => ({
      id: e.id,
      repositoryFullName: (e.repositoryId as any).fullName,
      eventType: e.eventType,
      action: e.action,
      status: e.status,
      receivedAt: e.receivedAt,
      processedAt: e.processedAt,
    })),
  });
}

export async function getEventStats(req: Request, res: Response): Promise<void> {
  const repoIds = await ownedRepositoryIds(req.user!.id);
  const grouped = await WebhookEvent.aggregate([
    { $match: { repositoryId: { $in: repoIds.map((id) => new Types.ObjectId(id)) } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const stats = { RECEIVED: 0, PROCESSING: 0, COMPLETED: 0, FAILED: 0 } as Record<string, number>;
  for (const row of grouped) {
    stats[row._id as string] = row.count;
  }
  res.json({ stats });
}

export async function getEventDetail(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const repoIds = await ownedRepositoryIds(req.user!.id);

  const event = await WebhookEvent.findOne({ _id: id, repositoryId: { $in: repoIds } }).populate(
    "repositoryId"
  );

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const [job, actionLogs] = await Promise.all([
    Job.findOne({ webhookEventId: event.id }),
    ActionLog.find({ webhookEventId: event.id }).populate("ruleId").sort({ createdAt: 1 }),
  ]);

  res.json({
    event: {
      id: event.id,
      repositoryFullName: (event.repositoryId as any).fullName,
      eventType: event.eventType,
      action: event.action,
      status: event.status,
      receivedAt: event.receivedAt,
      processedAt: event.processedAt,
      payload: event.payload,
      job: job ? { status: job.status, attempts: job.attempts, lastError: job.lastError } : null,
      actionLogs: actionLogs.map((log) => ({
        id: log.id,
        ruleName: (log.ruleId as any)?.name ?? null,
        type: log.type,
        status: log.status,
        detail: log.detail,
        createdAt: log.createdAt,
      })),
    },
  });
}
