// Unit tests for the progression rules (www/js/core/progression.js).
// Run: npm test   (uses Node's built-in test runner, no dependencies)
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../www/js/core/progression.js");

const SITES = ["gem", "giza", "alex", "luxor"].map(id => ({ id }));
const ids = SITES.map(s => s.id);
const st = () => ({ SR: {}, P: P.fresh() });

test("tokens = improvement of best stars, never paid twice", () => {
  const { P: s } = st();
  assert.equal(P.recordWin(s, "gem", 0, 0, 2), 2);
  assert.equal(P.recordWin(s, "gem", 0, 2, 2), 0, "same stars again pays nothing");
  assert.equal(P.recordWin(s, "gem", 0, 2, 1), 0, "worse run pays nothing");
  assert.equal(P.recordWin(s, "gem", 0, 2, 3), 1, "only the difference");
  assert.equal(s.tok, 3); assert.equal(s.tokEarned, 3);
  assert.equal(P.award(0, 3, 5), 0, "Endless gives no tokens");
});

test("levels: L1 free, unlock needs previous level completed and enough tokens", () => {
  const { SR, P: s } = st();
  assert.equal(P.levelStatus(SR, s, "gem", 0), "open");
  assert.equal(P.levelStatus(SR, s, "gem", 1), "blocked");
  SR.gem = [1, 0, 0, 0, 0];
  assert.equal(P.levelStatus(SR, s, "gem", 1), "short");
  s.tok = 1;
  assert.equal(P.levelStatus(SR, s, "gem", 1), "afford");
  assert.deepEqual(P.unlockLevel(SR, s, "gem", 1), { ok: true, cost: 1 });
  assert.equal(s.tok, 0);
  assert.equal(P.unlockLevel(SR, s, "gem", 1).ok, false, "no double charge");
  assert.equal(s.tok, 0);
  assert.equal(P.levelStatus(SR, s, "gem", 1), "open");
  assert.deepEqual([0, 1, 2, 3, 4].map(i => P.levelCost(i)), [0, 1, 2, 3, 3]);
});

test("canStart guards locked levels and Endless", () => {
  const { SR, P: s } = st();
  assert.ok(P.canStart(SR, s, "gem", 1));
  assert.ok(!P.canStart(SR, s, "gem", 4));
  assert.ok(!P.canStart(SR, s, "gem", 6), "Endless closed before L5 is completed");
  SR.gem = [3, 3, 3, 3, 1];
  assert.ok(P.canStart(SR, s, "gem", 6));
  assert.ok(!P.canStart(SR, s, "gem", 9, 5), "cannot skip Endless levels");
  assert.ok(P.canStart(SR, s, "gem", 9, 8));
});

test("place unlock: levels 1-3 completed + 6 stars on the previous place", () => {
  const { SR, P: s } = st();
  SR.gem = [3, 3, 0, 0, 0];
  assert.deepEqual(P.refreshSites(SR, s, SITES), [], "6★ but only 2 levels");
  SR.gem = [1, 1, 1, 0, 0];
  assert.deepEqual(P.refreshSites(SR, s, SITES), [], "3 levels but only 3★");
  SR.gem = [2, 2, 2, 0, 0];
  assert.deepEqual(P.refreshSites(SR, s, SITES), ["giza"]);
  assert.ok(P.placeOpen(s, SITES, 1));
  SR.gem = [0, 0, 0, 0, 0];
  P.refreshSites(SR, s, SITES);
  assert.ok(P.placeOpen(s, SITES, 1), "an opened place never re-locks");
  assert.ok(!P.placeOpen(s, SITES, 2), "no skipping: alex needs giza progress");
  const pp = P.placeProgress({ gem: [3, 1, 0, 0, 0] }, s, SITES[0], P.ruleOf(SITES[1]));
  assert.equal(pp.levels, 2); assert.equal(pp.stars, 4); assert.ok(pp.frac > 0 && pp.frac < 1);
  // per-place override
  const custom = { id: "giza", unlock: { levels: 1, stars: 1 } };
  assert.deepEqual(P.ruleOf(custom), { levels: 1, stars: 1 });
});

test("Token Trial: only when short of tokens, max 2 per place, re-checked on apply", () => {
  const { SR, P: s } = st();
  SR.gem = [1, 0, 0, 0, 0];
  assert.equal(P.tokenTrialLevel(SR, s, "gem"), 1);
  assert.ok(P.applyTrial(SR, s, "tok", "gem"));
  assert.equal(s.tok, 1);
  assert.equal(P.tokenTrialLevel(SR, s, "gem"), -1, "now affordable → no trial");
  s.tok = 0;
  assert.ok(P.applyTrial(SR, s, "tok", "gem"));
  s.tok = 0;
  assert.equal(P.tokenTrialLevel(SR, s, "gem"), -1, "cap reached");
  assert.equal(P.applyTrial(SR, s, "tok", "gem"), false);
});

test("Passage Trial: after 3 losses in a row, clears at 0★, once per place", () => {
  const { SR, P: s } = st();
  P.recordLoss(s, "gem", 0); P.recordLoss(s, "gem", 0);
  assert.ok(!P.passageTrial(SR, s, "gem", 0));
  P.recordLoss(s, "gem", 0);
  assert.ok(P.passageTrial(SR, s, "gem", 0));
  P.undoLoss(s, "gem", 0);
  assert.ok(!P.passageTrial(SR, s, "gem", 0), "continued run does not count");
  P.recordLoss(s, "gem", 0);
  assert.ok(P.applyTrial(SR, s, "pass", "gem", 0));
  assert.ok(P.levelDone(SR, s, "gem", 0));
  assert.equal(s.tok, 0, "passage gives no tokens");
  assert.equal(P.applyTrial(SR, s, "pass", "gem", 0), false, "not twice");
  // a later real win still pays its stars
  assert.equal(P.recordWin(s, "gem", 0, 0, 2), 2);
  // a win resets the loss counter
  for (let k = 0; k < 3; k++) P.recordLoss(s, "giza", 2);
  P.recordWin(s, "giza", 2, 0, 1);
  assert.equal(s.fails.giza[2], 0);
});

test("migration keeps everything open and gives tokens = best stars", () => {
  const SR = { gem: [3, 2, 0, 0, 0], giza: [1, 0, 0, 0, 0] };
  const s = P.migrate(SR, ["gem", "giza"], SITES);
  assert.deepEqual(s.ul.sites, ["giza"]);
  assert.ok(P.placeOpen(s, SITES, 1));
  assert.ok(!P.placeOpen(s, SITES, 2));
  assert.deepEqual(s.ul.levels.gem, [1, 1, 1, 0, 0], "L3 stays open (L2 had stars)");
  assert.deepEqual(s.ul.levels.giza, [1, 1, 0, 0, 0]);
  assert.equal(s.tok, 6); assert.equal(s.tokEarned, 6);
  // old rule: 3★ anywhere in the previous place opened the next one
  const s2 = P.migrate({ gem: [0, 0, 3, 0, 0] }, [], SITES);
  assert.deepEqual(s2.ul.sites, ["giza"]);
});

test("sanitize drops bad values and unknown ids; save round-trips", () => {
  const raw = { pv: 2, tok: -4, tokEarned: "7", ul: { sites: ["giza", "nope", "giza", 5], levels: { gem: [1, "x", 0, 1, 1, 1, 1], nope: [1] } },
    cleared: { gem: [0, 1] }, trial: { tok: { gem: "2", bad: 9 }, pass: { gem: null } }, fails: { gem: [2, -1, "a"] } };
  const s = P.sanitize(raw, ids);
  assert.equal(s.tok, 0); assert.equal(s.tokEarned, 7);
  assert.deepEqual(s.ul.sites, ["giza"]);
  assert.deepEqual(s.ul.levels, { gem: [1, 1, 0, 1, 1] });
  assert.deepEqual(s.cleared.gem, [0, 1, 0, 0, 0]);
  assert.deepEqual(s.trial, { tok: { gem: 2 }, pass: { gem: 0 } });
  assert.deepEqual(s.fails.gem, [2, 0, 0, 0, 0]);
  const back = P.sanitize(JSON.parse(JSON.stringify(P.toSave(s))), ids);
  assert.deepEqual(back, s);
  assert.deepEqual(P.sanitize(null, ids), P.fresh());
});

test("journey completes when every place is open and the last one meets the rule", () => {
  const { SR, P: s } = st();
  for (const x of SITES) SR[x.id] = [2, 2, 2, 0, 0];
  assert.ok(!P.journeyDone(SR, s, SITES));
  P.refreshSites(SR, s, SITES);
  assert.ok(P.journeyDone(SR, s, SITES));
  SR.luxor = [2, 2, 0, 0, 0];
  assert.ok(!P.journeyDone(SR, s, SITES));
});

test("points mode: places are bought in order, never by progress", () => {
  const c = { placeUnlock: "points", placeCostStep: 100 };
  const SR = { gem: [3, 3, 3, 3, 3] }, s = P.fresh();
  assert.deepEqual(P.refreshSites(SR, s, SITES, c), [], "progress alone opens nothing");
  assert.equal(P.placeCost(SITES[1], 1, c), 100); assert.equal(P.placeCost(SITES[3], 3, c), 300);
  assert.equal(P.placeCost({ id: "x", unlockCost: 42 }, 3, c), 42, "per-place override");
  assert.deepEqual(P.buyPlace(s, SITES, 2, false, 9999, c), { ok: false, reason: "blocked", cost: 200 }, "cannot skip ahead");
  assert.deepEqual(P.buyPlace(s, SITES, 1, true, 99, c), { ok: false, reason: "short", cost: 100 });
  assert.deepEqual(P.buyPlace(s, SITES, 1, true, 100, c), { ok: true, cost: 100 });
  assert.ok(P.placeOpen(s, SITES, 1));
  assert.equal(P.buyPlace(s, SITES, 1, true, 999, c).ok, false, "never charged twice");
  assert.equal(P.buyPlace(s, SITES, 0, true, 999, c).ok, false, "first place is free");
});
