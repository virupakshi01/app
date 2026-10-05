import { Schema, Types, model } from "mongoose";

export interface RepositoryAttrs {
  ownerId: Types.ObjectId;
  githubRepoId: string;
  fullName: string;
  webhookId?: string | null;
  webhookSecret: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const repositorySchema = new Schema<RepositoryAttrs>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    githubRepoId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    webhookId: { type: String },
    webhookSecret: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

repositorySchema.index({ ownerId: 1 });

export const Repository = model<RepositoryAttrs>("Repository", repositorySchema);
