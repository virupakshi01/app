import { Schema, Types, model } from "mongoose";

export type ActionLogType = "LABEL" | "COMMENT" | "SLACK";
export type ActionLogStatus = "SUCCESS" | "FAILED";

export interface ActionLogAttrs {
  webhookEventId: Types.ObjectId;
  ruleId?: Types.ObjectId | null;
  type: ActionLogType;
  status: ActionLogStatus;
  detail?: unknown;
  createdAt?: Date;
}

const actionLogSchema = new Schema<ActionLogAttrs>({
  webhookEventId: { type: Schema.Types.ObjectId, ref: "WebhookEvent", required: true },
  ruleId: { type: Schema.Types.ObjectId, ref: "Rule" },
  type: { type: String, enum: ["LABEL", "COMMENT", "SLACK"], required: true },
  status: { type: String, enum: ["SUCCESS", "FAILED"], required: true },
  detail: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: () => new Date() },
});

actionLogSchema.index({ webhookEventId: 1 });

export const ActionLog = model<ActionLogAttrs>("ActionLog", actionLogSchema);
