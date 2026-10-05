export interface RuleConditions {
  eventType?: string;
  action?: string;
  titleKeywords?: string[];
  author?: string;
  labels?: string[];
}

export interface RuleActions {
  addLabel?: string;
  postComment?: string;
  slackNotify?: boolean;
}

export interface RuleLike {
  id: string;
  enabled: boolean;
  conditions: RuleConditions;
  actions: RuleActions;
}

export interface WebhookEventLike {
  eventType: string;
  action: string | null;
  payload: unknown;
}

export interface ExtractedTarget {
  owner: string;
  repo: string;
  issueNumber: number | null;
  title: string | null;
  author: string | null;
  labels: string[];
}

/**
 * Pulls the fields the rule engine and GitHub actions care about out of a raw
 * GitHub webhook payload. Works for issues, pull_request and push events;
 * issueNumber/title/author/labels are null for events without an issue/PR
 * (e.g. push), which naturally excludes them from label/comment actions.
 */
export function extractTarget(payload: unknown): ExtractedTarget {
  const p = payload as Record<string, any>;
  const repoFullName: string = p?.repository?.full_name ?? "";
  const [owner, repo] = repoFullName.split("/");

  const subject = p?.issue ?? p?.pull_request ?? null;

  return {
    owner: owner ?? "",
    repo: repo ?? "",
    issueNumber: subject?.number ?? null,
    title: subject?.title ?? null,
    author: subject?.user?.login ?? null,
    labels: Array.isArray(subject?.labels)
      ? subject.labels.map((l: any) => (typeof l === "string" ? l : l.name))
      : [],
  };
}

function matchesConditions(
  conditions: RuleConditions,
  event: WebhookEventLike,
  target: ExtractedTarget
): boolean {
  if (conditions.eventType && conditions.eventType !== event.eventType) {
    return false;
  }
  if (conditions.action && conditions.action !== event.action) {
    return false;
  }
  if (conditions.author && conditions.author !== target.author) {
    return false;
  }
  if (conditions.labels && conditions.labels.length > 0) {
    const hasAny = conditions.labels.some((label) => target.labels.includes(label));
    if (!hasAny) {
      return false;
    }
  }
  if (conditions.titleKeywords && conditions.titleKeywords.length > 0) {
    const title = (target.title ?? "").toLowerCase();
    const hasAny = conditions.titleKeywords.some((kw) => title.includes(kw.toLowerCase()));
    if (!hasAny) {
      return false;
    }
  }
  return true;
}

export function evaluateRules<T extends RuleLike>(
  rules: T[],
  event: WebhookEventLike,
  target: ExtractedTarget
): T[] {
  return rules.filter((rule) => rule.enabled && matchesConditions(rule.conditions, event, target));
}
