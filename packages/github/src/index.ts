export function verifyGitHubSignature(payload: string, signature: string, secret: string) {
  return Boolean(payload && signature && secret);
}

export function createGitHubClient() {
  return { kind: "octokit-placeholder" };
}
