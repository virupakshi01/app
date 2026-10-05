import { WebClient } from "@slack/web-api";
import { env } from "../env";
import { logger } from "../logger";

const slackClient = env.SLACK_BOT_TOKEN ? new WebClient(env.SLACK_BOT_TOKEN) : null;

export async function sendSlackMessage(text: string, channel?: string): Promise<boolean> {
  if (!slackClient) {
    logger.warn("SLACK_BOT_TOKEN not configured; skipping Slack notification");
    return false;
  }

  try {
    await slackClient.chat.postMessage({
      channel: channel ?? env.SLACK_DEFAULT_CHANNEL,
      text,
    });
    return true;
  } catch (err) {
    logger.error({ err }, "Slack notification failed");
    return false;
  }
}
