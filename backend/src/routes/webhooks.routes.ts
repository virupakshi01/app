import express, { Router } from "express";
import { handleGithubWebhook } from "../controllers/webhookController";

export const webhooksRouter = Router();

// Raw body is required here (not the global JSON parser) so the HMAC
// signature can be verified against the exact bytes GitHub signed.
webhooksRouter.post("/github", express.raw({ type: "application/json", limit: "5mb" }), handleGithubWebhook);
