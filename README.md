# Tysiąc The Game

**Codename:** `Tysiąc The Game`

Nowoczesny, webowy stół do rodziny gier **Tysiąc** — jeden klient na desktop i mobile, multiplayer, boty oraz wersjonowane profile zasad.

## Product thesis

Najpierw dobra gra, potem elastyczność.

- otwierasz link i grasz;
- desktop i mobile są równorzędnymi klientami;
- prywatne stoły + boty są pierwszym celem;
- serwer jest autorytetem;
- rdzeń gry jest deterministyczny i testowalny;
- zasady nie są jednym hardcodowanym wariantem: realne odmiany Tysiąca są reprezentowane jako wersjonowane profile;
- oficjalne profile są certyfikowane scenariuszami i symulacjami.

## Current technical direction

- TypeScript
- React + Vite
- Cloudflare Worker + Static Assets
- Durable Object per match
- SQLite-backed Durable Object storage
- WebSocket Hibernation

Ten stack jest **current-best**, nie dogmatem. Zmieniamy go tylko na podstawie realnego evidence.

## First game mode

`3-player auction Tysiąc`

Pierwszy profil referencyjny: roboczo `POLISH_3P_800_CANDIDATE`.

## Development path

1. Headless hand — pełne rozdanie bez UI.
2. Headless match — gra do końca z botami testowymi.
3. Local table — Human + Bot + Bot w przeglądarce.
4. MatchDO — prawdziwy multiplayer Human + Human + Bot.
5. PC/mobile resilience — reconnect, background, refresh, weak network.
6. Friend build — wersja, którą warto normalnie wysłać do gry.

## Source of truth

- runtime truth: działający kod + testy;
- rules truth: profile + executable scenarios;
- architecture truth: aktualny kod + krótkie decyzje w `docs/`;
- product intent: `docs/PROJECT.md`;
- historia rozmów jest kontekstem, nie nadrzędnym authority.

## Current status

Projekt został zainicjalizowany 2026-09-12. Implementacja gameplayu jeszcze się nie rozpoczęła. Najbliższy etap to zamknięcie minimalnego Rules Architecture / Game Core Blueprint i pierwszy headless vertical slice.
