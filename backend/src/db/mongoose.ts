import mongoose from "mongoose";
import { env } from "../env";
import { logger } from "../logger";

export async function connectToDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI);
  logger.info("Connected to MongoDB");
}
