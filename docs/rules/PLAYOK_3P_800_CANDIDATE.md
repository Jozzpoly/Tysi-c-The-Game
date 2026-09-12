# PLAYOK_3P_800_CANDIDATE

Status: **candidate / partially documented / not reference-tested**

Purpose: first concrete 3-player implementation target, scoped to the documented Kurnik/PlayOK-style game rather than presented as canonical "Polish Tysiąc".

This profile is deliberately narrow. Where Kurnik text is ambiguous or other real implementations disagree, the uncertainty is kept explicit and must be pinned in executable scenarios before shipping.

## Scope

- game mode: 3-player auction Tysiąc;
- reference family: Kurnik / PlayOK documentation;
- match target: 1000;
- lock threshold: 800;
- no claim that this represents every Polish table.

## Strong documented structure

### Deck / deal

- 24 cards: 9, J, Q, K, 10, A in each suit.
- Trick rank: A > 10 > K > Q > J > 9.
- Card points: A=11, 10=10, K=4, Q=3, J=2, 9=0.
- 7 cards are dealt to each player plus a 3-card musik/talon.

### Auction

- The player immediately after the dealer is committed to at least 100.
- Further bids are multiples of 10.
- Passing removes the player from that auction.
- Bidding above 120 requires marriage capacity according to Kurnik's documented limit rule.
- The auction winner reveals/takes the musik.
- The winner gives one card to each opponent, leaving 8 cards per player.
- The declarer sets the final contract at no less than the winning bid.

### Trick play / marriages

- Declarer leads the first trick.
- Players are obliged to follow the led suit when able.
- Kurnik also documents an obligation to play a higher card when possible; the exact interaction with trump/overtrump is kept as a scenario below rather than silently generalized.
- A marriage is K+Q of one suit and is announced by leading one member while holding the other.
- Marriage values: spades 40, clubs 60, diamonds 80, hearts 100.
- Announcing a marriage establishes that suit as trump immediately.
- Kurnik permits marriage announcement on the first trick.
- Trick winner leads the next trick.
- Eight tricks end the hand.

### Scoring / match

- Declarer gains the contract value if successful and loses that value if unsuccessful.
- Defenders score their captured-card/marriage points under the profile's rounding rule.
- Kurnik documents defender rounding to tens with 5 rounded upward.
- At 800 or more, a player can increase score only as declarer.
- Match target is at least 1000.
- Kurnik documents special simultaneous-win resolution with the declarer taking precedence; exact executable examples belong in fixtures.

### Bomb / redeal

- Kurnik documents a bomb/withdrawal mechanism for a declarer who does not want to play the contract.
- Kurnik documents the first bomb as free and later bombs as granting 60 points to each opponent in 3P.
- Four nines can trigger a redeal request.

The exact bomb availability window/count semantics and exact four-nines timing are **not yet considered executable truth**.

## Provisional pins required for the first implementation

These are deliberate project choices needed to make an executable candidate. They are not yet PlayOK reference observations.

### Transfer visibility

`recipient-private`

Each opponent sees only the card received by that seat; the other transferred card is not public.

Reason: Kurnik documents the transfer but not its visibility. Pagat documents face-down transfer as a common baseline and face-up transfer as a variation. This pin preserves hidden information until PlayOK behavior is black-box checked.

### Trick obligation

`strict-follow-and-beat / trump-when-void / overtrump-when-possible`

Reason: this is consistent with the strict reading of Kurnik's obligations and with several modern implementations, but Pagat confirms that real Polish tables can differ. Treat it as a candidate behavior to reference-test, not family-core truth.

### Marriage score without later trick win

`declared-marriage-counts`

Reason: Kurnik states marriage scoring without Mizerca's explicit "must win at least one trick" condition. This is a textual-reading pin pending a focused reference probe.

## Material open scenarios

The following must remain explicit in tests/docs until resolved:

1. **Transfer visibility reference check** — confirm PlayOK actually behaves as `recipient-private`.
2. **Four nines: initial hand** — when exactly may a player request redeal?
3. **Four nines: received card** — can a transferred fourth nine create eligibility?
4. **Post-musik contract ceiling** — after seeing the musik, is the final contract constrained by the same marriage-capacity formula as auction bids?
5. **Bomb availability** — at what exact phase(s) may the declarer bomb?
6. **Bomb count/penalty** — whether "first free, later +60" has a hard count or any additional constraints.
7. **800 lock + bomb** — exact score interaction at/above the lock threshold.
8. **Stronger-card obligation** — precise legal set when following suit and when trump is already winning the trick.
9. **Marriage with zero captured tricks** — black-box check the provisional `declared-marriage-counts` pin.
10. **Simultaneous >=1000** — executable examples for declarer precedence, higher score and tie behavior.

## Not a separate 3P rule

There is no additional 3-player "musik points to the last trick" scoring step after the normal exchange. Once the auction winner takes the three-card musik and transfers two cards, all 24 cards are in the three 8-card hands and therefore enter trick play. Do not score those three cards a second time.

## Evidence labels

Use these terms in fixtures/reviews:

- `documented` — directly stated by Kurnik/PlayOK or another named source;
- `reference-observed` — reproduced in the actual/reference implementation;
- `pinned` — deliberately selected by this project where source behavior is ambiguous or variant;
- `executable` — enforced by our scenario tests.

## Primary references

- Kurnik / PlayOK: https://www.kurnik.pl/tysiac/zasady.phtml
- Pagat — 1000 / Polish Tysiąc: https://www.pagat.com/marriage/1000.html
- Mizerca — Thousand rules: https://mizerca.com/en/thousand-rules

A profile should not move beyond `candidate` merely because the implementation compiles. The material scenarios above need executable fixtures, and the PlayOK-specific ambiguities need reference observation where feasible.