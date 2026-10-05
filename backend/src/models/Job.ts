import { Schema, Types, model } from "mongoose";

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface JobAttrs {
  webhookEventId: Types.ObjectId;
  status: JobStatus;
  attempts: number;
  lastError?: string | null;
  nextRetryAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const jobSchema = new Schema<JobAttrs>(
  {
    webhookEventId: { type: Schema.Types.ObjectId, ref: "WebhookEvent", required: true, unique: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    nextRetryAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, nextRetryAt: 1 });

export const Job = model<JobAttrs>("Job", jobSchema);
