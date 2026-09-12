const CLAIM_URL_RE = /https:\/\/dash\.cloudflare\.com\/claim-preview\?[^\s)]+/giu;
const WORKERS_DEV_RE = /https:\/\/[a-z0-9.-]+\.workers\.dev(?:\/[^\s]*)?/iu;
const ANSI_RE = /\u001b\[[0-9;]*m/gu;

export function sanitizeTemporaryDeployOutput(text) {
  return text
    .replace(ANSI_RE, '')
    .replace(CLAIM_URL_RE, '[REDACTED_CLAIM_URL]')
    .replace(/claimToken=[^\s&]+/giu, 'claimToken=[REDACTED]');
}

export function findWorkersDevUrl(text) {
  return sanitizeTemporaryDeployOutput(text)
    .match(WORKERS_DEV_RE)?.[0]
    ?.replace(/[),.;]+$/u, '') ?? null;
}
