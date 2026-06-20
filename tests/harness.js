/* ============================================================
   Test harness — loads the real index.html into a jsdom DOM,
   stubs the Web Audio API (headless has no audio device), and
   returns helpers that drive the game the way a host would:
   clicking tiles/buttons and pressing keyboard shortcuts.

   The game's top-level `function` declarations (startGame,
   nextRound, endGame, …) become window properties, so tests can
   call them directly for fast round-stepping. All assertions read
   the real rendered DOM — i.e. exactly what the audience sees.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const HTML = fs.readFileSync(
  path.join(__dirname, "..", "index.html"),
  "utf8"
);

/* Minimal Web Audio + Audio mocks so the game's sound calls are no-ops
   instead of throwing in a headless environment. */
function installAudioMocks(window) {
  const param = () => ({
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    setTargetAtTime() {},
    value: 0,
  });
  const node = () => ({
    type: "",
    frequency: param(),
    gain: param(),
    buffer: null,
    connect() {
      return node();
    },
    start() {},
    stop() {},
  });
  class FakeAudioContext {
    constructor() {
      this.currentTime = 0;
      this.destination = {};
      this.state = "running";
    }
    createOscillator() {
      return node();
    }
    createGain() {
      return node();
    }
    createBufferSource() {
      return node();
    }
    // Leave clips undecoded → game uses its <audio> fallback (also mocked).
    decodeAudioData() {}
    resume() {
      return Promise.resolve();
    }
  }
  window.AudioContext = FakeAudioContext;
  window.webkitAudioContext = FakeAudioContext;
  class FakeAudio {
    constructor(src) {
      this.src = src;
      this.preload = "";
      this.currentTime = 0;
    }
    play() {
      return Promise.resolve();
    }
  }
  window.Audio = FakeAudio;
}

/* Build a fresh game instance. Each call is fully isolated. */
function loadGame() {
  const dom = new JSDOM(HTML, {
    runScripts: "dangerously",
    // do NOT fetch external resources (fonts/images) — irrelevant to logic
    beforeParse: installAudioMocks,
  });
  const { window } = dom;
  const { document } = window;

  const $ = (id) => document.getElementById(id);
  const num = (id) => Number($(id).textContent);

  const h = {
    dom,
    window,
    document,
    $,

    /* ---- actions (how a host actually plays) ---- */
    play: () => $("playBtn").click(),
    playAgain: () => $("againBtn").click(),
    clickTile: (i) =>
      document.querySelector('.tile[data-i="' + i + '"]').click(),
    clickStrikeZone: () => $("strikeZone").click(),
    awardF1: () => $("awardF1").click(),
    awardF2: () => $("awardF2").click(),
    openPanel: () => $("gear").click(),
    closePanel: () => $("hostClose").click(),
    pressKey: (key) =>
      document.dispatchEvent(
        new window.KeyboardEvent("keydown", { key, bubbles: true })
      ),

    /* direct flow controls (top-level functions are on window) */
    nextRound: () => window.nextRound(),
    endGame: () => window.endGame(),

    /* ---- observations (read the rendered DOM) ---- */
    startScreenActive: () => $("startScreen").classList.contains("active"),
    endScreenActive: () => $("endScreen").classList.contains("active"),
    boardHidden: () => document.body.classList.contains("hidden-board"),
    roundNum: () => num("roundNum"),
    roundInd: () => $("roundInd").textContent,
    publicQ: () => $("publicQ").textContent,
    hostQ: () => $("hostQ").textContent,
    tally: () => num("roundTally"),
    f1Score: () => num("f1Score"),
    f2Score: () => num("f2Score"),
    f1Name: () => $("f1Name").textContent,
    f2Name: () => $("f2Name").textContent,
    winnerName: () => $("winnerName").textContent,
    revealedCount: () => document.querySelectorAll(".tile.revealed").length,
    isRevealed: (i) =>
      document
        .querySelector('.tile[data-i="' + i + '"]')
        .classList.contains("revealed"),
    answerTileCount: () =>
      document.querySelectorAll(".tile:not(.empty)").length,
    emptyTileCount: () => document.querySelectorAll(".tile.empty").length,
    /* points printed on each revealed/answer tile, in board order */
    boardAnswerPoints: () =>
      [...document.querySelectorAll(".tile:not(.empty) .ans-pts")].map((el) =>
        Number(el.textContent)
      ),
    strikeOnCount: () => document.querySelectorAll(".strike-slot.on").length,
    bigStrikeShown: () => $("bigStrike").classList.contains("show"),
    bigStrikeCount: () => $("bigStrike").childElementCount,
  };
  return h;
}

const QUESTION_COUNT = 10;

module.exports = { loadGame, QUESTION_COUNT };
