import { env } from "../env";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

export interface GithubOAuthUser {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
}

export function buildAuthorizeUrl(state: string): string {
  const url = new URL(GITHUB_AUTHORIZE_URL);
  url.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.GITHUB_OAUTH_CALLBACK_URL);
  url.searchParams.set("scope", "repo read:user user:email");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_OAUTH_CALLBACK_URL,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed with status ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(data.error ?? "GitHub token exchange returned no access_token");
  }
  return data.access_token;
}

export async function fetchGithubUser(accessToken: string): Promise<GithubOAuthUser> {
  const response = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub user lookup failed with status ${response.status}`);
  }

  return (await response.json()) as GithubOAuthUser;
}
