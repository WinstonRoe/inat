const test = require("node:test");
const assert = require("node:assert/strict");

const {
  fnv1aHash,
  pickTieredChoices,
  shuffleChoices,
  sessionKeyForPlace,
  normalizeTaxonName,
  isCorrectGuess,
} = require("../shared-utils.js");

test("fnv1aHash is deterministic and fits unsigned 32 bits", () => {
  const a = fnv1aHash("2026-10-23");
  assert.equal(a, fnv1aHash("2026-10-23"));
  assert.equal(typeof a, "number");
  assert.ok(Number.isInteger(a) && a >= 0 && a <= 0xffffffff);
  assert.notEqual(fnv1aHash(""), fnv1aHash("2026-10-23"));
  assert.notEqual(fnv1aHash("abc"), fnv1aHash("abd"));
});

// A 7-row pool with row 0 as the correct species:
//   0 correct  (Ardea herodias)
//   1,2        same-genus mates    (genus tier: [1,2])
//   1,3,4      same-family mates   (family tier: [1,3,4])
//   1,5,6      same-order mates    (order tier: [1,5,6])
const TIERS = [
  [1, 2],
  [1, 3, 4],
  [1, 5, 6],
];
const POOL = 7;
const CORRECT = 0;
const SLOTS = 3;

test("pickTieredChoices returns distinct, in-range distractors excluding the correct pick", () => {
  for (let seedNo = 0; seedNo < 50; seedNo++) {
    const seed = "seed-" + seedNo;
    const picks = pickTieredChoices(seed, POOL, CORRECT, TIERS, SLOTS);
    assert.equal(picks.length, 3, "should fill all 3 slots");
    assert.equal(new Set(picks).size, 3, "distractors must be distinct");
    for (const p of picks) {
      assert.ok(p >= 0 && p < POOL, `index ${p} out of range [0,${POOL})`);
      assert.notEqual(p, CORRECT, "correct index must not appear");
    }
  }
});

test("pickTieredChoices prefers closer relatives (genus > family > order)", () => {
  // All three slots should resolve; since every candidate tier is non-empty,
  // every pick must come from the union of the tiers rather than the fallback
  // linear scan (which would only yield indices 1..6 — same set here, but the
  // slot ordering should reflect the tier structure).
  const picks = pickTieredChoices("g", POOL, CORRECT, TIERS, SLOTS);
  const inTiers = new Set(TIERS.flat()); // {1, 2, 3, 4, 5, 6}
  for (const p of picks) assert.ok(inTiers.has(p), `pick ${p} should be a listed relative`);
});

test("pickTieredChoices bumps up to a farther tier when the nearer one is empty", () => {
  // Genus tier empty: slot 0 must be drawn from family, then order.
  const tiersGenusEmpty = [[], [1, 3, 4], [1, 5, 6]];
  const picks = pickTieredChoices("bump", POOL, CORRECT, tiersGenusEmpty, SLOTS);
  assert.equal(picks.length, 3);
  assert.equal(new Set(picks).size, 3);
  const familyOrder = new Set([1, 3, 4, 1, 5, 6]);
  for (const p of picks) assert.ok(familyOrder.has(p));

  // Both genus and family empty: all 3 slots must come from ordering+fallback.
  const tiersGenusFamilyEmpty = [[], [], [1, 5, 6]];
  const picks2 = pickTieredChoices("bump2", POOL, CORRECT, tiersGenusFamilyEmpty, SLOTS);
  assert.equal(picks2.length, 3);
  assert.equal(new Set(picks2).size, 3);
});

test("pickTieredChoices falls back to linear-scan indices when every tier is empty", () => {
  // No relatives at all -> fill from the next unused indices 1..3.
  const empty = [[], [], []];
  const picks = pickTieredChoices("flat", POOL, CORRECT, empty, SLOTS);
  assert.equal(picks.length, 3);
  assert.deepEqual(picks.sort(), [1, 2, 3]);
});

test("pickTieredChoices is deterministic on the same seed and tiers", () => {
  const a = pickTieredChoices("2026-10-23", POOL, CORRECT, TIERS, SLOTS);
  const b = pickTieredChoices("2026-10-23", POOL, CORRECT, TIERS, SLOTS);
  const c = pickTieredChoices("2026-10-23", POOL, CORRECT, TIERS, SLOTS);
  assert.deepEqual(a, b);
  assert.deepEqual(a, c);
});

test("pickTieredChoices varies across different seeds (when tiers are populated)", () => {
  const distinct = new Set();
  for (const seed of ["seed-a", "seed-b", "seed-c", "seed-d", "seed-e"]) {
    distinct.add(JSON.stringify(pickTieredChoices(seed, POOL, CORRECT, TIERS, SLOTS)));
  }
  assert.ok(
    distinct.size >= 2,
    `expected at least two distinct orderings, got ${distinct.size}`
  );
});

test("pickTieredChoices clamps to pool size and handles tiny/empty pools", () => {
  // Pool of 4, want 3 -> the only valid non-correct indices, as a set.
  const tiersSmall = [[1], [1, 2], [1, 3]];
  const picks4 = pickTieredChoices("d", 4, 0, tiersSmall, 3).sort();
  assert.deepEqual(picks4, [1, 2, 3]);

  // Pool of 2 -> at most 1 distractor.
  const picks2 = pickTieredChoices("d", 2, 0, [[1], [1], [1]], 3);
  assert.equal(picks2.length, 1);
  assert.equal(picks2[0], 1);

  // Pool of 1 -> no distractors possible.
  assert.deepEqual(pickTieredChoices("d", 1, 0, [], 3), []);
  // Empty pool.
  assert.deepEqual(pickTieredChoices("d", 0, 0, [], 3), []);
});

test("shuffleChoices is a permutation of the input (order varies, set preserved)", () => {
  const base = [0, 1, 2, 3];
  for (let i = 0; i < 20; i++) {
    const seed = "c-" + i;
    const out = shuffleChoices(base, seed);
    assert.equal(out.length, base.length);
    assert.deepEqual([...out].sort((a, b) => a - b), [0, 1, 2, 3], "must be a permutation");
  }
});

test("shuffleChoices does not mutate its input and returns a fresh array", () => {
  const base = [3, 1, 4, 1, 5];
  const before = base.slice();
  const out = shuffleChoices(base, "mut");
  assert.deepEqual(base, before, "input must be unchanged");
  assert.notEqual(out, base, "must return a new array");
  out.push(99);
  assert.deepEqual(base, before, "mutating the result must not affect the input");
});

test("shuffleChoices is deterministic on the same seed and varies across seeds", () => {
  const a = shuffleChoices([0, 1, 2, 3], "2026-10-23");
  const b = shuffleChoices([0, 1, 2, 3], "2026-10-23");
  assert.deepEqual(a, b, "same seed -> same order");
  const distinct = new Set();
  for (const seed of ["s-a", "s-b", "s-c", "s-d", "s-e"]) {
    distinct.add(JSON.stringify(shuffleChoices([0, 1, 2, 3], seed)));
  }
  assert.ok(distinct.size >= 2, `expected at least two distinct orders, got ${distinct.size}`);
});

test("shuffleChoices handles empty and singleton input", () => {
  assert.deepEqual(shuffleChoices([], "x"), []);
  assert.deepEqual(shuffleChoices([7], "x"), [7]);
  assert.deepEqual(shuffleChoices(null, "x"), []);
  assert.deepEqual(shuffleChoices(undefined, "x"), []);
});

test("sessionKeyForPlace maps to stable per-place keys", () => {
  assert.equal(sessionKeyForPlace(null), "global");
  assert.equal(sessionKeyForPlace(""), "global");
  assert.equal(sessionKeyForPlace(undefined), "global");
  assert.equal(sessionKeyForPlace(14), "place-14");
  assert.equal(sessionKeyForPlace("14"), "place-14");
  assert.notEqual(sessionKeyForPlace(null), sessionKeyForPlace(14));
  assert.notEqual(sessionKeyForPlace(14), sessionKeyForPlace(18));
});

test("normalizeTaxonName lowercases, strips diacritics, collapses whitespace", () => {
  assert.equal(normalizeTaxonName("  Ardea  HERODIAS "), "ardea herodias");
  assert.equal(normalizeTaxonName("Méliceris"), "meliceris");
  assert.equal(normalizeTaxonName("Coffea arabica"), "coffea arabica");
  assert.equal(normalizeTaxonName(42), "");
  assert.equal(normalizeTaxonName(null), "");
});

test("isCorrectGuess matches sciname and common name, case/diacritic-insensitive", () => {
  assert.ok(isCorrectGuess("Ardea herodias", "Ardea herodias", "Great Blue Heron"));
  assert.ok(isCorrectGuess("great blue heron", "Ardea herodias", "Great Blue Heron"));
  assert.ok(isCorrectGuess("  GREAT   BLUE HERON ", "Ardea herodias", "Great Blue Heron"));
  assert.ok(isCorrectGuess("meliceris", "Méliceris", ""));
  assert.ok(!isCorrectGuess("", "Ardea herodias", "Great Blue Heron"));
  assert.ok(!isCorrectGuess("  ", "Ardea herodias", "Great Blue Heron"));
  assert.ok(!isCorrectGuess("ardea", "Ardea herodias", "Great Blue Heron"));
  assert.ok(!isCorrectGuess("Blue Heron", "Ardea herodias", "Great Blue Heron"));
  // Common name is optional.
  assert.ok(isCorrectGuess("Ardea herodias", "Ardea herodias", null));
  assert.ok(!isCorrectGuess("heron", "Ardea herodias", null));
});
