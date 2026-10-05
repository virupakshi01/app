import { Router } from "express";
import { getCurrentUser, handleGithubCallback, logout, startGithubLogin } from "../controllers/authController";
import { requireAuth } from "../middleware/auth.middleware";

export const authRouter = Router();

authRouter.get("/github", startGithubLogin);
authRouter.get("/github/callback", handleGithubCallback);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, getCurrentUser);
