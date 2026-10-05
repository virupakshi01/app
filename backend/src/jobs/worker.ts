import mongoose from "mongoose";
import { Job } from "../models/Job";
import { WebhookEvent } from "../models/WebhookEvent";
import { logger } from "../logger";
import { processWebhookEvent } from "./processEvent";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 5000;

function backoffFor(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** (attempts - 1), 10 * 60 * 1000);
}

async function claimNextJob() {
  // Atomic claim: findOneAndUpdate is a single server-side operation, so two
  // worker instances can never grab the same pending job (unlike a separate
  // findFirst + update pair).
  return Job.findOneAndUpdate(
    {
      status: { $in: ["PENDING", "FAILED"] },
      attempts: { $lt: MAX_ATTEMPTS },
      nextRetryAt: { $lte: new Date() },
    },
    { status: "PROCESSING" },
    { sort: { createdAt: 1 }, new: true }
  );
}

async function runOnce() {
  const job = await claimNextJob();
  if (!job) return;

  try {
    await WebhookEvent.updateOne({ _id: job.webhookEventId }, { status: "PROCESSING" });

    await processWebhookEvent(String(job.webhookEventId));

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Job.updateOne({ _id: job.id }, { status: "COMPLETED" }, { session });
        await WebhookEvent.updateOne(
          { _id: job.webhookEventId },
          { status: "COMPLETED", processedAt: new Date() },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
  } catch (err) {
    const attempts = job.attempts + 1;
    const exhausted = attempts >= MAX_ATTEMPTS;
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    logger.error({ err, jobId: job.id, attempts }, "Job processing failed");

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Job.updateOne(
          { _id: job.id },
          {
            status: exhausted ? "FAILED" : "PENDING",
            attempts,
            lastError: errorMessage,
            nextRetryAt: new Date(Date.now() + backoffFor(attempts)),
          },
          { session }
        );
        await WebhookEvent.updateOne(
          { _id: job.webhookEventId },
          { status: exhausted ? "FAILED" : "RECEIVED" },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
  }
}

let timer: NodeJS.Timeout | null = null;

export function startJobWorker(): void {
  if (timer) return;
  timer = setInterval(() => {
    runOnce().catch((err) => logger.error({ err }, "Job worker loop crashed"));
  }, POLL_INTERVAL_MS);
  logger.info("Background job worker started");
}

export function stopJobWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
