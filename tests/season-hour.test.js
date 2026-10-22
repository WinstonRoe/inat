const test = require("node:test");
const assert = require("node:assert/strict");

const { seasonHourMatrix, seasonHourIntensity } = require("../shared-utils.js");

test("seasonHourMatrix bins hour buckets into the 12x24 month/hour grid", () => {
  const buckets = {
    "2022-01-19T10:00:00Z": 7,
    "2022-01-19T11:00:00Z": 3,
    "2023-06-05T14:00:00Z": 5,
    "2023-06-05T14:00Z": 2, // same bucket, shorter ISO form also folds in
    "2021-12-31T23:30:00Z": 1,
  };
  const { matrix, total, peak } = seasonHourMatrix(buckets);
  assert.equal(matrix.length, 12);
  for (const row of matrix) assert.equal(row.length, 24);
  assert.equal(matrix[0][10], 7);
  assert.equal(matrix[0][11], 3);
  assert.equal(matrix[5][14], 7); // 5 + 2 folded into the same cell
  assert.equal(matrix[11][23], 1);
  assert.equal(total, 7 + 3 + 5 + 2 + 1);
  assert.equal(peak, 7);
});

test("seasonHourMatrix ignores malformed buckets and empty input", () => {
  const { matrix, total, peak } = seasonHourMatrix({
    "garbage": 10,
    "2022-13-40T99:00:00Z": 4, // month 13 / hour 99 are out of range
    "": 3,
  });
  assert.equal(total, 0);
  assert.equal(peak, 0);
  assert.equal(matrix.flat().every((n) => n === 0), true);

  const none = seasonHourMatrix({});
  assert.equal(none.total, 0);
  assert.equal(none.peak, 0);
  const undef = seasonHourMatrix(undefined);
  assert.equal(undef.total, 0);
});

test("seasonHourIntensity normalizes to the user's own peak (top cell = 4)", () => {
  assert.equal(seasonHourIntensity(0, 100), 0);
  assert.equal(seasonHourIntensity(50, 0), 0);
  assert.equal(seasonHourIntensity(7, 7), 4);
  assert.equal(seasonHourIntensity(1, 1), 4);
  // Fractions of a peak of 100:
  assert.equal(seasonHourIntensity(15, 100), 1);
  assert.equal(seasonHourIntensity(35, 100), 2);
  assert.equal(seasonHourIntensity(65, 100), 3);
  assert.equal(seasonHourIntensity(99, 100), 4);
});

test("seasonHourIntensity is defined on relative share, not absolute count", () => {
  // The absolute Activity Calendar scale would read these all as "1"; the
  // relative scale preserves internal contrast even for tiny totals.
  assert.equal(seasonHourIntensity(3, 3), 4);
  assert.equal(seasonHourIntensity(1, 3), 2);
});
