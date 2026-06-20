/* ============================================================
   Wagdi's Family Feud — full game-flow test suite.
   Drives the real index.html through every feature a host uses
   on game night. Run with:  npm test
   ============================================================ */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadGame, QUESTION_COUNT } = require("./harness");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------------------------------------
   1. Initial page state — before "LET'S PLAY"
   --------------------------------------------------------------- */
test("loads on the start screen with the board hidden", () => {
  const g = loadGame();
  assert.equal(g.startScreenActive(), true, "start screen active");
  assert.equal(g.endScreenActive(), false, "end screen hidden");
  assert.equal(g.boardHidden(), true, "game board hidden until play");
});

/* ---------------------------------------------------------------
   2. Starting a game
   --------------------------------------------------------------- */
test("LET'S PLAY starts the game and resets everything", () => {
  const g = loadGame();
  g.play();
  assert.equal(g.startScreenActive(), false, "start screen dismissed");
  assert.equal(g.boardHidden(), false, "board now visible");
  assert.equal(g.roundNum(), 1, "begins on round 1");
  assert.equal(g.f1Score(), 0, "F1 starts at 0");
  assert.equal(g.f2Score(), 0, "F2 starts at 0");
  assert.equal(g.tally(), 0, "round tally starts at 0");
  assert.equal(g.f1Name(), "THE BOUNDARY LAYERS");
  assert.equal(g.f2Name(), "THE WIND TUNNELS");
});

test("question text is shown to the audience and the host", () => {
  const g = loadGame();
  g.play();
  assert.ok(g.publicQ().length > 0, "public question populated");
  assert.equal(g.publicQ(), g.hostQ(), "host & public question match");
  assert.equal(g.roundInd(), "Round 1 / 10");
});

/* ---------------------------------------------------------------
   3. Revealing answers — by clicking a tile
   --------------------------------------------------------------- */
test("clicking a tile reveals it and adds its points to the tally", () => {
  const g = loadGame();
  g.play();
  const pts = g.boardAnswerPoints();
  g.clickTile(0);
  assert.equal(g.isRevealed(0), true, "tile flipped to revealed");
  assert.equal(g.revealedCount(), 1);
  assert.equal(g.tally(), pts[0], "tally == revealed answer's points");

  g.clickTile(2);
  assert.equal(g.revealedCount(), 2);
  assert.equal(g.tally(), pts[0] + pts[2], "tally accumulates");
});

test("revealing the same tile twice does not double-count", () => {
  const g = loadGame();
  g.play();
  const pts = g.boardAnswerPoints();
  g.clickTile(0);
  g.clickTile(0);
  assert.equal(g.revealedCount(), 1, "still only one revealed");
  assert.equal(g.tally(), pts[0], "points counted once");
});

/* ---------------------------------------------------------------
   4. Revealing answers — by keyboard shortcut
   --------------------------------------------------------------- */
test("number keys 1-5 reveal the matching answers", () => {
  const g = loadGame();
  g.play();
  const pts = g.boardAnswerPoints();
  g.pressKey("1");
  g.pressKey("3");
  assert.equal(g.isRevealed(0), true);
  assert.equal(g.isRevealed(2), true);
  assert.equal(g.tally(), pts[0] + pts[2]);
});

test("key '0' reveals the 10th answer only in the 10-answer round", () => {
  const g = loadGame();
  g.play();
  // Round 1 has 5 answers → '0' must do nothing.
  g.pressKey("0");
  assert.equal(g.revealedCount(), 0, "no 10th answer in a 5-answer round");

  // Round 4 (index 3) is the 10-answer round.
  g.nextRound();
  g.nextRound();
  g.nextRound();
  assert.equal(g.roundNum(), 4);
  assert.equal(g.answerTileCount(), 10, "round 4 has 10 answers");
  const pts = g.boardAnswerPoints();
  g.pressKey("0");
  assert.equal(g.isRevealed(9), true, "'0' reveals the 10th tile");
  assert.equal(g.tally(), pts[9]);
});

test("keyboard shortcuts are ignored while on the start screen", () => {
  const g = loadGame();
  g.pressKey("1"); // before play
  assert.equal(g.revealedCount(), 0);
});

/* ---------------------------------------------------------------
   5. Strikes
   --------------------------------------------------------------- */
test("strike zone cycles 1 → 2 → 3 → clear", () => {
  const g = loadGame();
  g.play();
  g.clickStrikeZone();
  assert.equal(g.strikeOnCount(), 1);
  assert.equal(g.bigStrikeShown(), true, "big overlay shows");
  assert.equal(g.bigStrikeCount(), 1, "one big X");

  g.clickStrikeZone();
  assert.equal(g.strikeOnCount(), 2);
  assert.equal(g.bigStrikeCount(), 2);

  g.clickStrikeZone();
  assert.equal(g.strikeOnCount(), 3);
  assert.equal(g.bigStrikeCount(), 3);

  g.clickStrikeZone(); // 4th click resets
  assert.equal(g.strikeOnCount(), 0, "strikes cleared on 4th click");
});

test("'S' key adds a strike", () => {
  const g = loadGame();
  g.play();
  g.pressKey("s");
  assert.equal(g.strikeOnCount(), 1);
  g.pressKey("S"); // uppercase also works
  assert.equal(g.strikeOnCount(), 2);
});

/* ---------------------------------------------------------------
   6. Awarding round points
   --------------------------------------------------------------- */
test("AWARD adds the tally to the chosen team and clears it", () => {
  const g = loadGame();
  g.play();
  const pts = g.boardAnswerPoints();
  g.clickTile(0);
  g.clickTile(1);
  const expected = pts[0] + pts[1];
  assert.equal(g.tally(), expected);

  g.awardF1();
  assert.equal(g.f1Score(), expected, "F1 banked the round points");
  assert.equal(g.f2Score(), 0, "F2 untouched");
  assert.equal(g.tally(), 0, "tally reset after award");
});

test("AWARD to family 2 works independently", () => {
  const g = loadGame();
  g.play();
  const pts = g.boardAnswerPoints();
  g.clickTile(0);
  g.awardF2();
  assert.equal(g.f2Score(), pts[0]);
  assert.equal(g.f1Score(), 0);
});

test("awarding with an empty tally is a no-op (no points, no advance)", () => {
  const g = loadGame();
  g.play();
  assert.equal(g.tally(), 0);
  g.awardF1();
  assert.equal(g.f1Score(), 0, "no points awarded");
  assert.equal(g.roundNum(), 1, "did not advance the round");
});

test("AWARD auto-advances to the next round after the fanfare", async () => {
  const g = loadGame();
  g.play();
  g.clickTile(0);
  g.awardF1();
  assert.equal(g.roundNum(), 1, "still on round 1 immediately after award");
  await delay(1600); // award() schedules nextRound() ~1.4s later
  assert.equal(g.roundNum(), 2, "advanced to round 2");
  assert.equal(g.tally(), 0, "fresh round, empty tally");
  assert.equal(g.revealedCount(), 0, "fresh board");
});

/* ---------------------------------------------------------------
   7. Round flow / advancing
   --------------------------------------------------------------- */
test("advancing a round resets the board, strikes and tally", () => {
  const g = loadGame();
  g.play();
  g.clickTile(0);
  g.clickStrikeZone();
  assert.ok(g.tally() > 0 && g.strikeOnCount() === 1);

  g.nextRound();
  assert.equal(g.roundNum(), 2);
  assert.equal(g.tally(), 0, "tally reset");
  assert.equal(g.strikeOnCount(), 0, "strikes reset");
  assert.equal(g.revealedCount(), 0, "board reset");
  assert.equal(g.roundInd(), "Round 2 / 10");
});

test("'N' key advances to the next round", () => {
  const g = loadGame();
  g.play();
  g.pressKey("n");
  assert.equal(g.roundNum(), 2);
});

/* ---------------------------------------------------------------
   8. Content integrity across all 10 rounds
   --------------------------------------------------------------- */
test("every round's answer points sum to exactly 100", () => {
  const g = loadGame();
  g.play();
  for (let r = 1; r <= QUESTION_COUNT; r++) {
    const pts = g.boardAnswerPoints();
    const sum = pts.reduce((a, b) => a + b, 0);
    assert.equal(sum, 100, `round ${r} points sum to 100 (got ${sum})`);
    if (r < QUESTION_COUNT) g.nextRound();
  }
});

test("each round renders the right number of tiles (answers + blanks = 10)", () => {
  const g = loadGame();
  g.play();
  for (let r = 1; r <= QUESTION_COUNT; r++) {
    const answers = g.answerTileCount();
    const blanks = g.emptyTileCount();
    assert.ok(answers >= 1, `round ${r} has at least one answer`);
    assert.equal(answers + blanks, 10, `round ${r} board has 10 tiles`);
    if (r < QUESTION_COUNT) g.nextRound();
  }
});

test("round 4 is the 10-answer round; round 10 is the final round", () => {
  const g = loadGame();
  g.play();
  g.nextRound();
  g.nextRound();
  g.nextRound();
  assert.equal(g.roundNum(), 4);
  assert.equal(g.answerTileCount(), 10, "round 4 fills the whole board");

  for (let i = 4; i < QUESTION_COUNT; i++) g.nextRound();
  assert.equal(g.roundNum(), 10);
  assert.ok(g.publicQ().includes("FINAL ROUND"), "round 10 is the final round");
});

/* ---------------------------------------------------------------
   9. Ending the game + winner determination
   --------------------------------------------------------------- */
test("advancing past the final round shows the end screen", () => {
  const g = loadGame();
  g.play();
  for (let i = 1; i < QUESTION_COUNT; i++) g.nextRound(); // reach round 10
  assert.equal(g.roundNum(), 10);
  g.nextRound(); // past the final round → end
  assert.equal(g.endScreenActive(), true, "end screen shown");
});

test("winner is the higher-scoring family", () => {
  const g = loadGame();
  g.play();
  g.clickTile(0); // give F1 some points
  g.awardF1();
  g.endGame();
  assert.equal(g.endScreenActive(), true);
  assert.equal(g.winnerName(), "THE BOUNDARY LAYERS");
});

test("family 2 can win", () => {
  const g = loadGame();
  g.play();
  g.clickTile(0);
  g.awardF2();
  g.endGame();
  assert.equal(g.winnerName(), "THE WIND TUNNELS");
});

test("equal scores produce a tie", () => {
  const g = loadGame();
  g.play();
  // no points awarded → 0–0
  g.endGame();
  assert.equal(g.winnerName(), "IT'S A TIE!");
});

/* ---------------------------------------------------------------
   10. Play again
   --------------------------------------------------------------- */
test("PLAY AGAIN returns to the start screen", () => {
  const g = loadGame();
  g.play();
  g.endGame();
  assert.equal(g.endScreenActive(), true);
  g.playAgain();
  assert.equal(g.startScreenActive(), true, "back on start screen");
  assert.equal(g.endScreenActive(), false, "end screen hidden");
  assert.equal(g.boardHidden(), true, "board hidden again");
});

test("starting a new game after one finishes resets scores", () => {
  const g = loadGame();
  g.play();
  g.clickTile(0);
  g.awardF1();
  assert.ok(g.f1Score() > 0);
  g.endGame();
  g.playAgain();
  g.play(); // brand new game
  assert.equal(g.f1Score(), 0, "scores reset");
  assert.equal(g.f2Score(), 0);
  assert.equal(g.roundNum(), 1, "back to round 1");
});
