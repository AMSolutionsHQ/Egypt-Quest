// Unit tests for local records (www/js/core/records.js)
const test = require("node:test");
const assert = require("node:assert/strict");
const R = require("../www/js/core/records.js");

test("keeps the 10 best runs by coins", () => {
  R.reset();
  for (let i = 1; i <= 14; i++) R.add({ i: "gem", l: 1, c: i * 3, t: 40, s: 2 });
  assert.equal(R.runs.length, 10);
  assert.equal(R.runs[0].c, 42); assert.equal(R.runs[9].c, 15);
  assert.equal(R.add({ i: "giza", l: 2, c: 1, t: 50, s: 1 }), -1, "a weak run is not kept");
});

test("fastest time per level, only improvements count", () => {
  R.reset();
  assert.equal(R.bestTime("gem", 0, 50), false, "first time is not a 'new record' message");
  assert.equal(R.time("gem", 0), 50);
  assert.equal(R.bestTime("gem", 0, 61), false);
  assert.equal(R.bestTime("gem", 0, 41.4), true);
  assert.equal(R.time("gem", 0), 41);
  assert.equal(R.bestTime("gem", 7, 10), false, "Endless levels are not timed");
});

test("clean() drops broken data and never throws", () => {
  const c = R.clean([{ i: "gem", l: "2", c: "30", t: -4, s: 9, d: "x" }, null, 5, { i: 3 }], { gem: [10, "a"], bad: "x" });
  assert.deepEqual(c.runs, [{ i: "gem", l: 2, c: 30, t: 0, s: 3, d: "" }]);
  assert.deepEqual(c.bt, { gem: [10, 0, 0, 0, 0] });
  assert.deepEqual(R.clean(undefined, null), { runs: [], bt: {} });
});
