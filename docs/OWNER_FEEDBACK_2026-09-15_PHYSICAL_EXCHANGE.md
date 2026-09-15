# Owner feedback — physical card exchange

Date: 2026-09-15
Source: real Owner interaction with the stable Run 05 candidate.

## Material finding

The current exchange interaction is not intuitive because it asks the player to encode recipient intent through selection order:

- first selected card -> one opponent;
- second selected card -> the other opponent;
- separate confirmation button commits the exchange.

That is an abstract form workflow imposed on a physical card-table interaction.

## Owner intent

Giving a card to another player should be spatial and physical:

- pick up the actual card from the hand;
- drag it toward the intended opponent;
- the intended opponent territory should visibly react as a valid recipient;
- dropping the card on that opponent assigns that exact card to that exact recipient;
- the card should visibly remain with/near that recipient as a staged transfer;
- the player should be able to take a staged card back before the exchange is complete;
- after one card has been physically assigned to each opponent, the atomic game exchange can commit automatically;
- no "1st selected / 2nd selected" mapping and no separate "confirm exchange" button should be required.

## Architecture boundary

The authoritative game command may remain atomic (`exchange` with two recipient-card pairs). The physical interaction can stage the two recipient assignments locally and translate them into that existing command only after both spatial assignments exist.

This is a presentation/input correction, not evidence that the core exchange rule is wrong.

## Evidence requirement

The replacement interaction should be browser-tested on both desktop mouse and mobile/touch semantics. The test should prove recipient identity comes from the actual spatial drop target, not from selection order, and that the post-command material transfer continues from the staged card positions rather than visually teleporting back to the hand first.
