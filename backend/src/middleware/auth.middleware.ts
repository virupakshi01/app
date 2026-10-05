import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";

export interface SessionPayload {
  id: string;
  githubId: string;
  username: string;
}

export function issueSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, env.SESSION_SECRET, { expiresIn: "7d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.session;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.SESSION_SECRET) as SessionPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}
