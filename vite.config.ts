import { execFileSync } from 'node:child_process';
import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

function sourceCommitAtBuild(): string {
  try {
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 2_000 }).trim();
    return /^[0-9a-f]{40}$/.test(sha) ? sha : 'unavailable';
  } catch {
    return 'unavailable'; // e.g. unpacked archive without Git history
  }
}

export default defineConfig({
  plugins: [react(), cloudflare()],
  // Stamped into the *loaded browser bundle*, not inferred from Worker /api/match.
  // This is source checkout identity, not a cryptographic digest of JS bytes.
  define: { __TYSIAC_CLIENT_SOURCE_SHA__: JSON.stringify(sourceCommitAtBuild()) },
});
