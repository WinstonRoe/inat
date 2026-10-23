const test = require("node:test");
const assert = require("node:assert/strict");

const {
  fnv1aHash,
  pickChoices,
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

test("pickChoices returns distinct, in-range distractors excluding the correct pick", () => {
  for (let i = 0; i < 50; i++) {
    const pool = 40;
    const correct = i % pool;
    const picks = pickChoices("seed-" + i, pool, correct, 3);
    assert.equal(picks.length, 3);
    assert.equal(new Set(picks).size, 3, "distractors must be distinct");
    for (const p of picks) {
      assert.ok(p >= 0 && p < pool, `index ${p} out of range [0,${pool})`);
      assert.notEqual(p, correct, "correct index must not appear");
    }
  }
});

test("pickChoices is deterministic across runs on the same seed", () => {
  assert.deepEqual(
    pickChoices("2026-10-23", 250, 7, 3),
    pickChoices("2026-10-23", 250, 7, 3)
  );
  assert.deepEqual(
    pickChoices("2026-10-23", 250, 7, 3),
    pickChoices("2026-10-23", 250, 7, 3)
  );
});

test("pickChoices returns different distractors for different seeds", () => {
  const a = pickChoices("seed-a", 250, 7, 3);
  const b = pickChoices("seed-b", 250, 7, 3);
  assert.notDeepEqual(a, b);
});

test("pickChoices clamps to pool size and handles tiny pools", () => {
  // Pool of 4, want 3 distractors -> all 3 valid non-correct indices, as a set.
  const picks = pickChoices("d", 4, 0, 3).sort();
  assert.deepEqual(picks, [1, 2, 3]);

  // Pool of 2 -> at most 1 distractor.
  const picks2 = pickChoices("d", 2, 0, 3);
  assert.equal(picks2.length, 1);
  assert.equal(picks2[0], 1);

  // Pool of 1 -> no distractors possible.
  assert.deepEqual(pickChoices("d", 1, 0, 3), []);
  // Empty pool.
  assert.deepEqual(pickChoices("d", 0, 0, 3), []);
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
