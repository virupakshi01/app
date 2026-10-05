import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./env";
import { logger } from "./logger";
import { apiRouter, webhooksRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(pinoHttp({ logger }));
  app.use(cookieParser());

  // Mounted before the global JSON parser: it needs the raw request body to
  // verify GitHub's HMAC signature.
  app.use("/api/webhooks", webhooksRouter);

  app.use(express.json());
  app.use("/api", apiRouter);

  app.use(errorHandler);

  return app;
}
