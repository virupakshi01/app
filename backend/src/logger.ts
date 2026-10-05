import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.accessToken",
      "*.access_token",
      "*.webhookSecret",
      "*.client_secret",
      "*.token",
      "*.SLACK_BOT_TOKEN",
      "*.SESSION_SECRET",
      "*.GITHUB_CLIENT_SECRET",
    ],
    censor: "[REDACTED]",
  },
});
