import { Schema, Types, model } from "mongoose";

export type EventStatus = "RECEIVED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface WebhookEventAttrs {
  deliveryId: string;
  repositoryId: Types.ObjectId;
  eventType: string;
  action?: string | null;
  payload: unknown;
  status: EventStatus;
  receivedAt: Date;
  processedAt?: Date | null;
}

const webhookEventSchema = new Schema<WebhookEventAttrs>({
  deliveryId: { type: String, required: true, unique: true },
  repositoryId: { type: Schema.Types.ObjectId, ref: "Repository", required: true },
  eventType: { type: String, required: true },
  action: { type: String },
  payload: { type: Schema.Types.Mixed, required: true },
  status: {
    type: String,
    enum: ["RECEIVED", "PROCESSING", "COMPLETED", "FAILED"],
    default: "RECEIVED",
  },
  receivedAt: { type: Date, default: () => new Date() },
  processedAt: { type: Date },
});

webhookEventSchema.index({ repositoryId: 1 });
webhookEventSchema.index({ status: 1 });

export const WebhookEvent = model<WebhookEventAttrs>("WebhookEvent", webhookEventSchema);
