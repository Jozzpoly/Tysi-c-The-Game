# POLISH_3P_800_CANDIDATE

Status: **candidate / not certified**

Purpose: first practical 3-player reference profile. It is intentionally close to the currently documented Kurnik/Polish 800 style, but uncertain behavior stays explicit until scenario-verified.

## Stable core assumptions

- 3 active players.
- 24 cards: 9, J, Q, K, 10, A in four suits.
- Rank: A > 10 > K > Q > J > 9.
- Card points: 11 / 10 / 4 / 3 / 2 / 0.
- Deal: 7 cards per player + 3-card talon.
- Auction proceeds in steps of 10.
- First bidder has compulsory 100.
- Pass removes a player from the current auction.
- Auction winner reveals/takes the talon and gives one card to each opponent.
- All players enter trick play with 8 cards.
- Declarer leads the first trick.
- Marriage values: spades 40, clubs 60, diamonds 80, hearts 100.
- Declaring a marriage changes trump immediately.
- Trick winner leads next.
- Eight tricks complete the hand.
- Declarer gains contract value on success and loses it on failure.
- Match target: at least 1000.

## Candidate profile behavior

These are current candidates, not yet all certified:

- auction above 120 requires marriage capacity;
- strict follow-suit / beat-when-possible behavior;
- mandatory trump when void in lead suit;
- mandatory overtrump when possible;
- lock threshold 800;
- defender rounding to tens with 5 rounded upward;
- Kurnik-style bomb semantics;
- marriage may be declared on the first trick.

## Material unresolved scenarios

Before certification, resolve at least:

1. visibility of the two cards transferred after taking the talon;
2. exact four-nines redeal timing;
3. whether a fourth nine received during transfer qualifies;
4. maximum final contract after seeing the talon;
5. exact bomb availability window;
6. bomb interaction with the 800 lock;
7. precise stronger-card obligation when a trump already wins the trick;
8. marriage scoring when the player wins no trick;
9. confirm there is no additional 3P talon scoring after all 24 cards entered tricks.

## Provenance candidates

Primary references currently used by project research:

- Kurnik / PlayOK — Polish Tysiąc rules and reference behavior;
- Pagat — Polish and regional variant map;
- Mizerca — modern browser implementation and useful contrasting rule behavior.

Friend feedback may later produce a separate profile instead of mutating this one.

## Certification rule

Do not rename this profile to a certified/stable profile until required scenario fixtures, invariants and full-hand/full-match simulations pass.
