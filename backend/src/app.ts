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

  const allowedOrigins = [
    env.FRONTEND_URL,
    "http://localhost:4200",
    "https://app-sooty-pi-51.vercel.app",
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
    })
  );
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
