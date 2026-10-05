import { sendSlackMessage } from "../slack/client";
import { ExtractedTarget, WebhookEventLike } from "../rules/engine";

export function formatSlackMessage(params: {
  repoFullName: string;
  event: WebhookEventLike;
  target: ExtractedTarget;
  actionSummary: string;
}): string {
  const { repoFullName, event, target, actionSummary } = params;
  const subject = target.title ? `"${target.title}"` : "(no title)";
  return [
    `*${repoFullName}* — ${event.eventType}${event.action ? `.${event.action}` : ""}`,
    `${subject}${target.author ? ` by ${target.author}` : ""}`,
    actionSummary,
  ].join("\n");
}

export async function notifySlack(message: string): Promise<boolean> {
  return sendSlackMessage(message);
}
