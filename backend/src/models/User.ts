import { Schema, model } from "mongoose";

export interface UserAttrs {
  githubId: string;
  username: string;
  email?: string | null;
  avatarUrl?: string | null;
  accessToken: string;
}

const userSchema = new Schema<UserAttrs>(
  {
    githubId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String },
    avatarUrl: { type: String },
    accessToken: { type: String, required: true },
  },
  { timestamps: true }
);

export const User = model<UserAttrs>("User", userSchema);
