import { Schema, Types, model } from "mongoose";
import { RuleActions, RuleConditions } from "../rules/engine";

export interface RuleAttrs {
  repositoryId: Types.ObjectId;
  name: string;
  enabled: boolean;
  conditions: RuleConditions;
  actions: RuleActions;
  createdAt?: Date;
  updatedAt?: Date;
}

const ruleSchema = new Schema<RuleAttrs>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: "Repository", required: true },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    conditions: { type: Schema.Types.Mixed, required: true },
    actions: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

ruleSchema.index({ repositoryId: 1 });

export const Rule = model<RuleAttrs>("Rule", ruleSchema);
