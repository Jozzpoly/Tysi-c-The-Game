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

Kurnik documents all of the following:

- the declarer can withdraw from playing by throwing a bomb;
- bombing does not subtract the bid/contract from the declarer;
- the first bomb is free;
- on later bombs, each opponent receives +60 in 3P (+40 in 4P);
- if a player **gets four nines**, that player may ask for a redeal.

The first-free/later-60 bomb behavior and the existence of the optional four-nines redeal are therefore **documented** target-family evidence, not borrowed from another Tysiąc variant.

Kurnik does **not** state a maximum number of bombs. Pagat's separate Polish variant describes a two-bomb maximum at some tables; this project does not import that limit into the PlayOK candidate without target evidence.

Kurnik also does not explicitly define whether "first bomb" is counted globally or per player. The current executable candidate counts bombs **per player for the duration of the match**. That scope is a project pin pending reference observation, not a documented PlayOK fact.

Exact PlayOK bomb timing and the interaction between bomb-awarded points and the 800 lock are likewise not explicitly specified by the Kurnik text. They are pinned below and remain reference-sensitive.

For four nines, Pagat provides useful corroborating evidence from the broader 1000 family: it checks the condition after the talon exchange, explicitly warns that the declarer can give a defender the fourth nine, and describes a redeal by the same dealer. That evidence strongly supports the current candidate semantics, but it is **not** direct observation of PlayOK itself.

## Provisional pins required for the executable candidate

These are deliberate project choices needed to make an executable candidate. They are not yet PlayOK reference observations.

### Transfer visibility

`recipient-private`

Each opponent sees only the card received by that seat; the other transferred card is not public.

Reason: Kurnik documents the transfer but not its visibility. Other documented Tysiąc families contain both private and face-up transfer variants. This pin preserves hidden information until PlayOK behavior is reference-checked.

### Final contract ceiling after the musik

`same-marriage-cap-after-exchange`

After taking the musik and transferring two cards, the current implementation allows the final declaration from the winning auction value up to `120 + value of marriages still held`.

Reason: Kurnik explicitly caps what may be **bid** above 120, but its separate post-musik sentence only says that the final declaration cannot be lower than the winning bid. It does not explicitly repeat the upper marriage-cap rule for the final declaration. However, `120 + marriages still held` is also the maximum theoretical score available from all card points plus melds still available to that hand. Current source evidence does not justify allowing deliberately impossible final contracts above that amount, so this remains a conservative reversible pin rather than a known bug.

### Bomb window

`after-talon-before-exchange`

The declarer may bomb after the auction has finished and the musik has been revealed/taken, but before committing the two-card exchange.

Reason: Kurnik documents withdrawal by the declarer but does not precisely state the UI/phase boundary. This is the smallest clean candidate window consistent with the sequence of the documented game and with common Polish descriptions that place the decision after seeing the musik.

### Bomb counting / award / 800 lock

`per-player-count / ordinary-lock-applies-to-bomb-awards`

- each player's bomb count persists across hands in that match;
- bomb number 1 **for that player**: no score change;
- that player's bomb number 2+: each opponent is eligible for +60;
- an opponent already at 800 or more does not receive that +60;
- there is no candidate maximum bomb count.

Reason: Kurnik documents first-free/later-60, but not the counter scope. Per-player counting is the current reversible pin. Separately, Kurnik places the general 800 rule immediately after the bomb scoring rule and states that at 800+ further points are gained only while being the declarer. Applying the ordinary lock to bomb awards is the current textual-reading pin, pending reference observation.

### Four nines

`after-exchange-before-contract / optional / same-dealer-redeal`

Candidate behavior:

- eligibility is evaluated after the declarer has passed one card to each opponent and before the final contract is declared;
- a nine received in that exchange counts, so a defender can become eligible by receiving the fourth nine;
- the eligible player may either request a redeal or continue the hand;
- redeal does not alter scores, bomb counters or the hand number;
- the same dealer deals the replacement hand;
- the replacement deck uses the next deterministic shuffle seed in the project implementation.

Evidence boundary:

- **documented by Kurnik:** a player who gets four nines may request a redeal;
- **corroborated by Pagat:** post-exchange timing, received-fourth-nine eligibility and same-dealer redeal;
- **pinned by this project:** applying those broader-family details to the PlayOK candidate until PlayOK itself is reference-observed.

Hidden-information handling is a protocol/product requirement rather than an external rule claim: the option is private to the eligible seat. If that player chooses to continue, other seats are not told that four nines were held. A requested redeal becomes public because the redeal itself necessarily reveals the reason/action.

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

Independent descriptions of common 2P variants explicitly leave cards outside trick play and award those cards to the last-trick winner, which is a plausible explanation for Kurnik's unified wording. This makes `no-extra-3p-musik-score` the current-best interpretation, **but not a PlayOK-observed fact**.

## Material open scenarios

1. **3P musik/last-trick reference check** — confirm that PlayOK 3P does not add a second score for the original musik cards.
2. **Transfer visibility reference check** — confirm PlayOK behavior for the two passed cards.
3. **Four nines reference validation** — confirm actual PlayOK timing, received-fourth-nine behavior and same-dealer redeal; current behavior is documented/corroborated/executable but not PlayOK-observed.
4. **Post-musik contract ceiling** — validate or replace `same-marriage-cap-after-exchange`; do not remove it merely because Kurnik only phrases the auction cap explicitly.
5. **Bomb reference validation** — confirm PlayOK's exact bomb window, counter scope (global vs per-player), and whether an opponent at 800+ is blocked from the repeated-bomb +60 award.
6. **Stronger-card obligation reference check** — validate the strict trump/overtrump legal set against actual PlayOK behavior.
7. **Marriage with zero captured tricks** — reference-check `declared-marriage-counts`.

## Executable scenarios currently present

The mandatory core/browser smoke suites pin and exercise:

- compulsory 100 auction resolution;
- bidding above 120 bounded by marriage capacity;
- hidden-state seat projection boundary;
- first per-player bomb free;
- repeated per-player bomb +60 award with ordinary 800-lock behavior;
- bomb count persistence across hands;
- bomb ending a hand before exchange/trick play while preserving card invariants;
- deliberate bomb confirmation UI on desktop and true 390 px mobile;
- a defender receiving the fourth nine from the declarer;
- private four-nines option visibility and legal-command isolation;
- decline/continue without public disclosure;
- same-dealer, same-hand-number redeal with unchanged scores and bomb counters;
- four-nines UI/privacy checks on desktop and true 390 px mobile;
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
