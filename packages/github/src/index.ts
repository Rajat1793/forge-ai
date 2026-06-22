import crypto from "node:crypto";
import { Octokit } from "@octokit/rest";

export type GitHubEnv = {
  appId?: string;
  privateKey?: string;
  webhookSecret?: string;
  oauthToken?: string;
};

export function hasGitHubAuth(): boolean {
  return Boolean(process.env.GITHUB_OAUTH_TOKEN || process.env.GITHUB_APP_PRIVATE_KEY);
}

export function createGitHubClient(token?: string): Octokit {
  return new Octokit({
    auth: token ?? process.env.GITHUB_OAUTH_TOKEN,
    userAgent: "forge-ai/0.1",
  });
}

export function verifyGitHubSignature(
  payload: string,
  signature: string | null,
  secret: string | undefined,
): boolean {
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!signature) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

export type GitHubPullRequestPayload = {
  action: string;
  number: number;
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    state: "open" | "closed";
    merged: boolean;
    head: { ref: string; sha: string };
    base: { ref: string };
    html_url: string;
    user: { login: string };
    created_at: string;
    merged_at: string | null;
    closed_at: string | null;
  };
  repository: {
    id: number;
    name: string;
    owner: { login: string };
    default_branch: string;
  };
};

export type GitHubInstallationRepo = {
  id: number;
  name: string;
  owner: string;
  default_branch: string;
};

export async function listRepos(client: Octokit): Promise<GitHubInstallationRepo[]> {
  const { data } = await client.repos.listForAuthenticatedUser({
    per_page: 50,
    sort: "updated",
  });
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    owner: r.owner.login,
    default_branch: r.default_branch ?? "main",
  }));
}

export async function getPullRequestFiles(
  client: Octokit,
  owner: string,
  repo: string,
  number: number,
) {
  const { data } = await client.pulls.listFiles({ owner, repo, pull_number: number });
  return data.map((f) => ({
    filename: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
    patch: f.patch ?? null,
  }));
}

export async function postPullRequestComment(
  client: Octokit,
  owner: string,
  repo: string,
  number: number,
  body: string,
) {
  return client.issues.createComment({
    owner,
    repo,
    issue_number: number,
    body,
  });
}
