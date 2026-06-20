# Wagdi's Family Feud

A fully self-contained Family Feud game built as a single HTML file — no build tools, no frameworks, no dependencies.

![Game Screenshot](https://github.com/Juntakk/family-feud/raw/main/preview.png)

## Features

- **10 rounds** — rounds 1–9 have 5 answers each, round 10 is a 10-answer final round
- **3D tile flip animation** on answer reveal
- **Real Family Feud sound effects** — correct answer ding and incorrect buzzer, both embedded directly in the file
- **Strike system** — click the strike zone under the board to cycle through 1 → 2 → 3 strikes, with a giant animated red ✗ overlay and the real buzzer sound; 4th click resets to zero
- **Host control panel** — hidden ⚙ button (bottom-left) slides open a panel with reveal buttons, award points, and next round controls
- **Live scoreboard** for both teams
- **End screen** with winner announcement and confetti

## Teams

- 🔵 The Boundary Layers
- 🟠 The Wind Tunnels

## How to Play

1. Open `wagdis-family-feud.html` in any modern browser
2. Click **LET'S PLAY**
3. The host opens the side panel (⚙ bottom-left) to control the game
4. Click a tile on the board (or use the host panel) to reveal answers
5. Click the strike zone under the tiles to add a strike
6. Use the host panel to award round points to a team and advance to the next round

## Host Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1`–`9`, `0` | Reveal answer #1–10 |
| `S` | Add a strike |
| `N` | Next round |

## Customizing Questions

Questions are defined in the `QUESTIONS` array at the top of the `<script>` tag — easy to edit directly:

```js
{ q: "Name something people do first thing in the morning",
  answers: [["Check phone", 40], ["Make coffee", 25], ["Shower", 18], ["Brush teeth", 11], ["Stretch", 6]] }
```

Each round's answer points should sum to 100. Rounds 1–9 take 5 answers; round 10 takes up to 10.

## Tests

A full game-flow test suite drives the real `index.html` (via jsdom) through every feature — start, reveal (click + keyboard), point tallying, strikes, awarding, round advancement, all 10 questions summing to 100, end-game/winner logic, and play-again.

```bash
npm install   # one-time: installs jsdom
npm test
```

Tests live in `tests/` and use Node's built-in test runner (no extra framework).

## Tech

- Vanilla HTML/CSS/JS — single file, zero dependencies
- Web Audio API for sound (no external audio files — both clips are base64-embedded)
- Google Fonts: Bebas Neue + Barlow Condensed (loaded via CDN)
- Designed for 1280×800+ landscape displays
