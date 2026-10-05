import { WebhookEvent } from "../models/WebhookEvent";
import { Repository } from "../models/Repository";
import { Rule } from "../models/Rule";
import { ActionLog } from "../models/ActionLog";
import { logger } from "../logger";
import { evaluateRules, extractTarget, RuleActions, RuleConditions } from "../rules/engine";
import { applyGithubAction } from "../services/githubService";
import { formatSlackMessage, notifySlack } from "../services/slackService";

/**
 * Runs the rule engine for one persisted WebhookEvent and executes matched
 * actions (GitHub label/comment, Slack). Every action attempt is written to
 * ActionLog regardless of outcome so failures stay visible in the dashboard.
 * Throws on unexpected failure so the caller (jobs/worker.ts) can retry.
 */
export async function processWebhookEvent(webhookEventId: string): Promise<void> {
  const webhookEvent = await WebhookEvent.findById(webhookEventId);
  if (!webhookEvent) {
    throw new Error(`WebhookEvent ${webhookEventId} not found`);
  }

  const repository = await Repository.findById(webhookEvent.repositoryId).populate("ownerId");
  if (!repository) {
    throw new Error(`Repository ${webhookEvent.repositoryId} not found`);
  }

  const rules = await Rule.find({ repositoryId: webhookEvent.repositoryId, enabled: true });

  const target = extractTarget(webhookEvent.payload);
  const matched = evaluateRules(
    rules.map((r) => ({
      id: r.id,
      enabled: r.enabled,
      conditions: r.conditions as unknown as RuleConditions,
      actions: r.actions as unknown as RuleActions,
    })),
    { eventType: webhookEvent.eventType, action: webhookEvent.action ?? null, payload: webhookEvent.payload },
    target
  );

  const accessToken = (repository.ownerId as any).accessToken as string;

  for (const rule of matched) {
    const actions = rule.actions;

    if ((actions.addLabel || actions.postComment) && target.issueNumber) {
      const result = await applyGithubAction({
        accessToken,
        owner: target.owner,
        repo: target.repo,
        issueNumber: target.issueNumber,
        addLabel: actions.addLabel,
        postComment: actions.postComment,
      });

      if (actions.addLabel) {
        await ActionLog.create({
          webhookEventId,
          ruleId: rule.id,
          type: "LABEL",
          status: result.addLabel ? "SUCCESS" : "FAILED",
          detail: { label: actions.addLabel },
        });
      }
      if (actions.postComment) {
        await ActionLog.create({
          webhookEventId,
          ruleId: rule.id,
          type: "COMMENT",
          status: result.postComment ? "SUCCESS" : "FAILED",
          detail: { body: actions.postComment },
        });
      }
    }

    if (actions.slackNotify) {
      const message = formatSlackMessage({
        repoFullName: repository.fullName,
        event: { eventType: webhookEvent.eventType, action: webhookEvent.action ?? null, payload: webhookEvent.payload },
        target,
        actionSummary: `Matched rule "${rule.id}"`,
      });
      const delivered = await notifySlack(message);
      await ActionLog.create({
        webhookEventId,
        ruleId: rule.id,
        type: "SLACK",
        status: delivered ? "SUCCESS" : "FAILED",
        detail: { message },
      });
    }
  }

  logger.info(
    { webhookEventId, matchedRules: matched.length },
    "Processed webhook event"
  );
}
