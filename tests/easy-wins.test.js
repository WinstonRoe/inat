const test = require("node:test");
const assert = require("node:assert/strict");

const { computeEase, easeLabel, fetchTaxonEase, STUCK_QUALITY_GRADE } =
  require("../shared-utils.js");

test("computeEase returns the research-grade share as a rounded 0-100", () => {
  assert.equal(computeEase(400, 400), 100);
  assert.equal(computeEase(200, 400), 50);
  assert.equal(computeEase(399, 400), 100);
  assert.equal(computeEase(1, 3), 33);
});

test("computeEase treats no verifiable data as 0 (hard), never dividing by zero", () => {
  assert.equal(computeEase(0, 0), 0);
  assert.equal(computeEase(5, 0), 0);
  assert.equal(computeEase(5, -10), 0);
  assert.equal(computeEase(null, 100), 0);
});

test("computeEase clamps to the 0-100 range", () => {
  assert.equal(computeEase(0, 100), 0);
  assert.equal(computeEase(200, 100), 100);
  assert.equal(computeEase(-5, 100), 0);
});

test("easeLabel buckets the score into easy / medium / hard", () => {
  assert.equal(easeLabel(100), "easy");
  assert.equal(easeLabel(80), "easy");
  assert.equal(easeLabel(79), "medium");
  assert.equal(easeLabel(40), "medium");
  assert.equal(easeLabel(39), "hard");
  assert.equal(easeLabel(0), "hard");
});

test("STUCK_QUALITY_GRADE is needs_id (casual obs are not verifiable)", () => {
  assert.equal(STUCK_QUALITY_GRADE, "needs_id");
});

test("fetchTaxonEase reads the grade breakdown from one quality_grades call", async () => {
  const seenUrls = [];
  global.fetch = async (url) => {
    seenUrls.push(url);
    return {
      ok: true,
      json: async () => ({
        total_results: 2,
        results: [
          { quality_grade: "research", count: 400 },
          { quality_grade: "needs_id", count: 34 },
        ],
      }),
    };
  };
  try {
    const result = await fetchTaxonEase("https://api.inaturalist.org/v1", 6930);
    assert.equal(result.taxonId, 6930);
    assert.equal(result.verifiable, 434);
    assert.equal(result.research, 400);
    assert.equal(result.ease, computeEase(400, 434));
    assert.equal(result.badge, undefined);
    // One call per taxon (the whole point of switching to quality_grades)
    assert.equal(seenUrls.length, 1);
    assert.ok(seenUrls[0].includes("/observations/quality_grades"));
    assert.ok(seenUrls[0].includes("taxon_id=6930"));
    assert.ok(seenUrls[0].includes("verifiable=true"));
  } finally {
    delete global.fetch;
  }
});

test("fetchTaxonEase with no verifiable data reads as hard (ease 0)", async () => {
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ total_results: 0, results: [] }),
  });
  try {
    const result = await fetchTaxonEase("https://api.inaturalist.org/v1", 1);
    assert.equal(result.verifiable, 0);
    assert.equal(result.research, 0);
    assert.equal(result.ease, 0);
    assert.equal(easeLabel(result.ease), "hard");
  } finally {
    delete global.fetch;
  }
});
