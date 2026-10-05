import { Request, Response } from "express";
import crypto from "crypto";
import { User } from "../models/User";
import { env } from "../env";
import { buildAuthorizeUrl, exchangeCodeForToken, fetchGithubUser } from "../github/oauth";
import { issueSessionToken } from "../middleware/auth.middleware";
import { logger } from "../logger";

const STATE_COOKIE = "oauth_state";

export function startGithubLogin(req: Request, res: Response): void {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 5 * 60 * 1000,
  });
  res.redirect(buildAuthorizeUrl(state));
}

export async function handleGithubCallback(req: Request, res: Response): Promise<void> {
  const { code, state } = req.query as { code?: string; state?: string };
  const expectedState = req.cookies?.[STATE_COOKIE];

  if (!code || !state || !expectedState || state !== expectedState) {
    res.status(400).json({ error: "Invalid OAuth state" });
    return;
  }
  res.clearCookie(STATE_COOKIE);

  try {
    const accessToken = await exchangeCodeForToken(code);
    const githubUser = await fetchGithubUser(accessToken);

    const user = await User.findOneAndUpdate(
      { githubId: String(githubUser.id) },
      {
        githubId: String(githubUser.id),
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        accessToken,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const sessionToken = issueSessionToken({
      id: user.id,
      githubId: user.githubId,
      username: user.username,
    });

    res.cookie("session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(env.FRONTEND_URL);
  } catch (err) {
    logger.error({ err }, "GitHub OAuth callback failed");
    res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
  }
}

export function logout(req: Request, res: Response): void {
  res.clearCookie("session");
  res.status(204).send();
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
  });
}
