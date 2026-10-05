import {
  addLabel,
  generateWebhookSecret,
  listUserRepositories,
  postComment,
  registerRepositoryWebhook,
} from "../github/client";
import { Repository } from "../models/Repository";
import { logger } from "../logger";

export async function getConnectableRepositories(accessToken: string) {
  const repos = await listUserRepositories(accessToken);
  return repos.map((r) => ({
    githubRepoId: String(r.id),
    fullName: r.full_name,
    private: r.private,
    description: r.description,
  }));
}

export async function connectRepository(params: {
  ownerId: string;
  accessToken: string;
  githubRepoId: string;
  fullName: string;
}) {
  const [owner, repo] = params.fullName.split("/");
  const secret = generateWebhookSecret();

  const webhookId = await registerRepositoryWebhook({
    accessToken: params.accessToken,
    owner,
    repo,
    secret,
  });

  return Repository.findOneAndUpdate(
    { githubRepoId: params.githubRepoId },
    {
      ownerId: params.ownerId,
      githubRepoId: params.githubRepoId,
      fullName: params.fullName,
      webhookId,
      webhookSecret: secret,
      isActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function applyGithubAction(params: {
  accessToken: string;
  owner: string;
  repo: string;
  issueNumber: number;
  addLabel?: string;
  postComment?: string;
}) {
  const results: { addLabel?: boolean; postComment?: boolean } = {};

  if (params.addLabel) {
    try {
      await addLabel({
        accessToken: params.accessToken,
        owner: params.owner,
        repo: params.repo,
        issueNumber: params.issueNumber,
        label: params.addLabel,
      });
      results.addLabel = true;
    } catch (err) {
      logger.error({ err, repo: params.repo }, "Failed to add GitHub label");
      results.addLabel = false;
    }
  }

  if (params.postComment) {
    try {
      await postComment({
        accessToken: params.accessToken,
        owner: params.owner,
        repo: params.repo,
        issueNumber: params.issueNumber,
        body: params.postComment,
      });
      results.postComment = true;
    } catch (err) {
      logger.error({ err, repo: params.repo }, "Failed to post GitHub comment");
      results.postComment = false;
    }
  }

  return results;
}
