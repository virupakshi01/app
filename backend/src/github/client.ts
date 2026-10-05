import { Octokit } from "@octokit/rest";
import crypto from "crypto";
import { env } from "../env";

export function validatePublicWebhookUrl(url: string): string {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    throw new Error(
      "GitHub webhook registration requires a public HTTPS URL. localhost is not reachable over the public Internet. Use a tunnel such as ngrok or Cloudflare Tunnel and set BACKEND_URL to that public URL."
    );
  }

  if (parsed.protocol !== "https:") {
    throw new Error(
      `GitHub webhook registration requires a public HTTPS URL, but received ${url}.`
    );
  }

  return parsed.toString().replace(/\/$/, "");
}

export function githubClientFor(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken });
}

export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function listUserRepositories(accessToken: string) {
  const octokit = githubClientFor(accessToken);
  const { data } = await octokit.repos.listForAuthenticatedUser({
    per_page: 100,
    sort: "updated",
  });
  return data;
}

export async function registerRepositoryWebhook(params: {
  accessToken: string;
  owner: string;
  repo: string;
  secret: string;
}): Promise<string> {
  const octokit = githubClientFor(params.accessToken);
  const webhookBaseUrl = validatePublicWebhookUrl(env.BACKEND_URL);
  const { data } = await octokit.repos.createWebhook({
    owner: params.owner,
    repo: params.repo,
    config: {
      url: `${webhookBaseUrl}/api/webhooks/github`,
      content_type: "json",
      secret: params.secret,
    },
    events: ["issues", "pull_request", "push"],
  });
  return String(data.id);
}

export async function addLabel(params: {
  accessToken: string;
  owner: string;
  repo: string;
  issueNumber: number;
  label: string;
}) {
  const octokit = githubClientFor(params.accessToken);
  return octokit.issues.addLabels({
    owner: params.owner,
    repo: params.repo,
    issue_number: params.issueNumber,
    labels: [params.label],
  });
}

export async function postComment(params: {
  accessToken: string;
  owner: string;
  repo: string;
  issueNumber: number;
  body: string;
}) {
  const octokit = githubClientFor(params.accessToken);
  return octokit.issues.createComment({
    owner: params.owner,
    repo: params.repo,
    issue_number: params.issueNumber,
    body: params.body,
  });
}
