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
- Bidding above 120 requires at least one marriage and Kurnik limits the bid to `120 + value of marriages held`.
- Passing removes the player from that auction.
- The auction winner reveals/takes the musik.
- The winner gives one card to each opponent, leaving 8 cards per player.
- The declarer sets the final contract at no less than the winning bid.

### Trick play / marriages

- Declarer leads the first trick.
- Players are obliged to follow the led suit when able.
- Kurnik also documents an obligation to play a higher card when possible; the exact interaction with trump/overtrump remains a reference-sensitive scenario rather than universal Tysiąc truth.
- A marriage is K+Q of one suit and is announced by leading one member while holding the other.
- Marriage values: spades 40, clubs 60, diamonds 80, hearts 100.
- Announcing a marriage establishes that suit as trump immediately.
- Kurnik permits marriage announcement on the first trick.
- Trick winner leads the next trick.
- Eight tricks end the 3P hand.

### Scoring / match

- Declarer gains the contract value if successful and loses that value if unsuccessful.
- Defenders score their captured-card/marriage points under the profile's rounding rule.
- Kurnik documents defender rounding to tens with 5 rounded upward.
- At 800 or more, a player can increase score only as declarer.
- Match target is at least 1000.
- Kurnik documents special simultaneous-win resolution with the declarer taking precedence; executable coverage exists in the current core smoke suite.

### Bomb / redeal

- Kurnik documents a bomb/withdrawal mechanism for a declarer who does not want to play the contract.
- Kurnik documents the first bomb as free and later bombs as granting 60 points to each opponent in 3P.
- Four nines can trigger a redeal request.

The exact bomb window/count semantics, interaction with the 800 lock, and exact four-nines timing are **not yet executable truth**.

## Provisional pins required for the first implementation

These are deliberate project choices needed to make an executable candidate. They are not yet PlayOK reference observations.

### Transfer visibility

`recipient-private`

Each opponent sees only the card received by that seat; the other transferred card is not public.

Reason: Kurnik documents the transfer but not its visibility. Other documented Tysiąc families contain both private and face-up transfer variants. This pin preserves hidden information until PlayOK behavior is reference-checked.

### Final contract ceiling after the musik

`same-marriage-cap-after-exchange`

After taking the musik and transferring two cards, the current implementation allows the final declaration from the winning auction value up to `120 + value of marriages still held`.

Reason: Kurnik explicitly says the final declaration cannot be lower than the winning bid, but does not clearly state whether the auction's marriage-capacity ceiling continues after the musik. This is an explicit reversible implementation pin pending a PlayOK reference probe.

### Trick obligation

`strict-follow-and-beat / trump-when-void / overtrump-when-possible`

Reason: this is consistent with a strict algorithmic reading of Kurnik's "follow suit and beat, with follow-suit precedence", but other real Polish tables differ on mandatory trumping. Treat it as candidate behavior to reference-test, not family-core truth.

Current executable scenarios cover:

- following the led suit before considering trump;
- mandatory stronger card in the led suit when available;
- mandatory trump when void in the led suit;
- mandatory overtrump when a higher trump is available.

### Marriage score without later trick win

`declared-marriage-counts`

Reason: Kurnik states marriage scoring without the additional captured-trick condition found in some other implementations. This is a textual-reading pin pending a focused reference probe.

### 3P musik / last-trick scoring

`no-extra-3p-musik-score` **for the current implementation only**.

Kurnik's unified rules page says that points for cards "from the musiks" go to the winner of the last trick. That statement cannot be applied naively to the current 3P deal without double-counting, because the 3-card musik is taken by the declarer, two cards are transferred, and all 24 cards then enter the eight tricks.

Independent descriptions of common 2P variants explicitly leave four cards outside trick play and award those cards to the last-trick winner, which is a plausible explanation for Kurnik's unified wording. This makes `no-extra-3p-musik-score` the current-best interpretation, **but not a PlayOK-observed fact**. The earlier repository claim that this issue was definitively resolved was too strong and has been withdrawn.

## Material open scenarios

1. **3P musik/last-trick reference check** — confirm that PlayOK 3P does not add a second score for the original musik cards.
2. **Transfer visibility reference check** — confirm PlayOK behavior for the two passed cards.
3. **Four nines: initial hand vs received card** — determine the exact eligibility point and whether a transferred fourth nine counts.
4. **Post-musik contract ceiling reference check** — validate or replace `same-marriage-cap-after-exchange`.
5. **Bomb availability** — exact phase(s) in which the declarer can bomb.
6. **Bomb repetition/penalty** — exact count semantics beyond Kurnik's first-free/later-60 wording.
7. **800 lock + bomb** — whether bomb-awarded opponent points are blocked by the 800 lock.
8. **Stronger-card obligation reference check** — validate the strict trump/overtrump legal set against actual PlayOK behavior.
9. **Marriage with zero captured tricks** — reference-check `declared-marriage-counts`.

## Executable scenarios currently present

The core smoke suite pins and exercises:

- compulsory 100 auction resolution;
- bidding above 120 bounded by marriage capacity;
- hidden-state seat projection boundary;
- strict follow-and-beat behavior;
- trump when void;
- overtrump when possible;
- lead-suit precedence over trump;
- marriage establishing trump and adding its value;
- defender 800 lock behavior;
- simultaneous >=1000 declarer precedence;
- deterministic complete hand simulations;
- deterministic complete match simulations;
- card conservation / uniqueness and captured-point accounting invariants.

These scenarios prove **our candidate implementation behavior**. They do not by themselves prove that every provisional pin matches PlayOK.

## Evidence labels

- `documented` — directly stated by Kurnik/PlayOK or another named source;
- `reference-observed` — reproduced in the actual/reference implementation;
- `pinned` — deliberately selected by this project where source behavior is ambiguous or variant;
- `executable` — enforced by our scenario tests.

## Primary references

- Kurnik / PlayOK: https://www.kurnik.pl/tysiac/zasady.phtml
- Pagat — 1000 / Polish Tysiąc: https://www.pagat.com/marriage/1000.html
- Mizerca — Thousand rules: https://mizerca.com/en/thousand-rules

A profile should not move beyond `candidate` merely because the implementation compiles. Material reference-sensitive questions above still need observation against PlayOK where feasible.