import { readFile } from 'node:fs/promises';

const source = await readFile('scripts/public-share-link-smoke.mjs', 'utf8');

function requireMatch(label, pattern) {
  if (!pattern.test(source)) throw new Error(`share-link contract: missing ${label}: ${pattern}`);
}

requireMatch('real clipboard capture', /window\.__tysiacCopiedLink/u);
requireMatch('room-only invite contract', /friend invite must contain only room query parameter/u);
requireMatch('credential-leak rejection', /friend invite leaked a seat credential/u);
requireMatch('clean pre-join visitor', /friend invite visitor unexpectedly owns credential before joining/u);
requireMatch('both players reach live game', /host reaches live exact-invite session/u);
requireMatch('private hands stay disjoint', /privateHandsDisjoint:\s*true/u);
requireMatch('human action is executed', /clickAuctionDecision/u);
requireMatch('same-session synchronization', /exact-invite action synchronized/u);
requireMatch('action sync evidence', /actionSynced:\s*true/u);
requireMatch('friend reconnect uses copied room URL', /friend reconnects through same copied room URL/u);
requireMatch('friend token survives reconnect', /value\.token === friendToken/u);
requireMatch('friend reconnect evidence', /friendReconnected:\s*true/u);
requireMatch('restored revision evidence', /restoredRevision:\s*restored\.revision/u);

console.log('share-link contract smoke: PASS');
