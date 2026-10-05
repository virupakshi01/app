import { createApp } from "./app";
import { env } from "./env";
import { logger } from "./logger";
import { connectToDatabase } from "./db/mongoose";
import { startJobWorker } from "./jobs/worker";

async function main() {
  await connectToDatabase();

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`Backend listening on ${env.BACKEND_URL} (port ${env.PORT})`);
    startJobWorker();
  });
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
