// Unit tests for save validation (www/js/core/savecheck.js)
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../www/js/core/savecheck.js");

// a realistic save as written by save() in v4.4.0
const GOOD = {
  score: 1234, done: ["gem", "giza"], seen: ["gem", "giza", "alex"], muted: true, prog: { giza: [0, 2, 5] }, lvl: {},
  ach: ["first", "perfect"], streak: 12, lastDay: "2026-11-02", dailyClaim: "2026-11-02", dailyDay: "2026-11-02", dailyId: "giza",
  SR: { gem: [3, 2, 1, 0, 0], giza: [1, 0, 0, 0, 0] }, spent: 400, inv: { hint: 7, time: 1, boost: 0, freeze: 2, ward: 3 },
  own: ["sunset", "lucky"], theme: "sunset", qDay: "2026-11-02", qIds: ["win", "star", "bonus"], qp: { win: 1, star: 3 }, qcl: { win: 1 },
  chestAt: 1793000000000, loginDay: 5, ENDL: { gem: 7 }, curseOn: false, themeMode: "auto",
  pv: 2, tok: 3, tokEarned: 9, ul: { sites: ["giza"], levels: { gem: [1, 1, 1, 0, 0] } }, cleared: {}, trial: { tok: {}, pass: {} }, fails: {}
};

test("a valid save passes through unchanged (no data loss)", () => {
  assert.deepEqual(S.clean(JSON.parse(JSON.stringify(GOOD))), GOOD);
});

test("broken fields get new-player defaults, the rest is kept", () => {
  const bad = { ...GOOD, score: "abc", spent: -50, done: "gem", ach: [1, "first", null], streak: null, lastDay: "yesterday",
    SR: { gem: [9, -1, "2", null], giza: "x" }, inv: null, theme: "rainbow", qp: { win: "x", star: 2 }, ENDL: { gem: 3, giza: 8 },
    loginDay: 99, chestAt: "soon", muted: "yes", themeMode: "disco" };
  const c = S.clean(bad);
  assert.equal(c.score, 0); assert.equal(c.spent, 0);
  assert.deepEqual(c.done, []); assert.deepEqual(c.ach, ["first"]);
  assert.equal(c.streak, 0); assert.equal(c.lastDay, "");
  assert.deepEqual(c.SR, { gem: [3, 0, 2, 0, 0] });
  assert.deepEqual(c.inv, { hint: 5, time: 0, boost: 0, freeze: 0, ward: 0 });
  assert.equal(c.theme, "classic"); assert.deepEqual(c.qp, { star: 2 }); assert.deepEqual(c.ENDL, { giza: 8 });
  assert.equal(c.loginDay, 7); assert.equal(c.chestAt, 0); assert.equal(c.muted, false);
  assert.ok(!("themeMode" in c));
  assert.equal(c.tok, 3, "progression fields are left for progression.js");
  assert.deepEqual(c.own, GOOD.own);
});

test("missing inventory keys keep the usual defaults", () => {
  assert.deepEqual(S.clean({ inv: { hint: 2 } }).inv, { hint: 2, time: 0, boost: 0, freeze: 0, ward: 0 });
  assert.deepEqual(S.clean({}).inv, { hint: 5, time: 0, boost: 0, freeze: 0, ward: 0 });
});

test("non-object input never throws", () => {
  for (const v of [null, undefined, 5, "x", [], true]) assert.equal(S.clean(v).score, 0);
});

test("parse: only JSON objects", () => {
  assert.equal(S.parse("{broken"), null); assert.equal(S.parse("[1,2]"), null); assert.equal(S.parse(""), null); assert.equal(S.parse(null), null);
  assert.deepEqual(S.parse('{"a":1}'), { a: 1 });
});
