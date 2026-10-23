const test = require("node:test");
const assert = require("node:assert/strict");

const {
  fnv1aHash,
  slotFromSeed,
  normalizeTaxonName,
  isCorrectGuess,
  pickPuzzleSlots,
} = require("../shared-utils.js");

test("fnv1aHash is deterministic and fits unsigned 32 bits", () => {
  const a = fnv1aHash("2026-10-23");
  assert.equal(a, fnv1aHash("2026-10-23"));
  assert.equal(typeof a, "number");
  assert.ok(Number.isInteger(a) && a >= 0 && a <= 0xffffffff);
  assert.notEqual(fnv1aHash(""), fnv1aHash("2026-10-23"));
  assert.notEqual(fnv1aHash("abc"), fnv1aHash("abd"));
});

test("slotFromSeed stays in range for any pool size and is stable", () => {
  for (const n of [1, 5, 42, 250]) {
    for (let i = 0; i < 50; i++) {
      const s = slotFromSeed("2026-10-23:" + i, n);
      assert.ok(s >= 0 && s < n, `slot ${s} out of range [0,${n})`);
      assert.equal(s, slotFromSeed("2026-10-23:" + i, n));
    }
  }
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

test("pickPuzzleSlots returns distinct, in-range, valid indices per day", () => {
  // 30 rows, 8 invalid; want 10 distinct valid ones.
  const rows = Array.from({ length: 30 }, (_, i) => i);
  const isValid = (i) => i % 4 !== 0; // 8 invalid
  for (const seed of ["day-a", "day-b"]) {
    const slots = pickPuzzleSlots(seed, rows, isValid, 10);
    assert.equal(slots.length, 10);
    assert.equal(new Set(slots).size, 10, "slots must be distinct");
    for (const s of slots) {
      assert.ok(s >= 0 && s < 30, `slot ${s} out of range`);
      assert.ok(isValid(s), `slot ${s} landed on an invalid row`);
    }
    assert.deepEqual(slots, pickPuzzleSlots(seed, rows, isValid, 10));
  }
});

test("pickPuzzleSlots clamps to pool size and handles empty pools", () => {
  const rows = [0, 1, 2];
  const all = pickPuzzleSlots("d", rows, () => true, 10).sort();
  assert.deepEqual(all, [0, 1, 2]);
  assert.deepEqual(pickPuzzleSlots("d", [], () => true, 5), []);
  assert.deepEqual(pickPuzzleSlots("d", rows, () => false, 5), []);
});
