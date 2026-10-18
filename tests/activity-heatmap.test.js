const test = require("node:test");
const assert = require("node:assert/strict");

const { heatmapIntensity, heatmapWeeks, heatmapMonthLabels } =
  require("../shared-utils.js");

const d = (s) => {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
};

test("heatmapIntensity buckets counts on the Activity Calendar scale", () => {
  assert.equal(heatmapIntensity(0), 0);
  assert.equal(heatmapIntensity(1), 1);
  assert.equal(heatmapIntensity(2), 2);
  assert.equal(heatmapIntensity(4), 2);
  assert.equal(heatmapIntensity(5), 3);
  assert.equal(heatmapIntensity(9), 3);
  assert.equal(heatmapIntensity(10), 4);
  assert.equal(heatmapIntensity(1000), 4);
  assert.equal(heatmapIntensity("7"), 3);
  assert.equal(heatmapIntensity(null), 0);
  assert.equal(heatmapIntensity(undefined), 0);
});

test("heatmapWeeks lays out Sun-first columns of seven days each", () => {
  const weeks = heatmapWeeks({}, d("2025-01-05"), d("2025-01-18"), "2025-01-15");
  assert.equal(weeks.length, 2);
  assert.deepEqual(weeks[0].dates, [
    "2025-01-05",
    "2025-01-06",
    "2025-01-07",
    "2025-01-08",
    "2025-01-09",
    "2025-01-10",
    "2025-01-11",
  ]);
  assert.deepEqual(weeks[1].dates, [
    "2025-01-12",
    "2025-01-13",
    "2025-01-14",
    "2025-01-15",
    "2025-01-16",
    "2025-01-17",
    "2025-01-18",
  ]);
});

test("heatmapWeeks maps counts and flags days after today as future zeros", () => {
  const dayData = { "2025-01-07": 5, "2025-01-13": 1, "2025-01-20": 999 };
  const weeks = heatmapWeeks(dayData, d("2025-01-05"), d("2025-01-18"), "2025-01-15");
  assert.deepEqual(weeks[0].counts, [0, 0, 5, 0, 0, 0, 0]);
  assert.deepEqual(weeks[0].futures, [false, false, false, false, false, false, false]);
  assert.deepEqual(weeks[1].counts, [0, 1, 0, 0, 0, 0, 0]);
  assert.deepEqual(weeks[1].futures, [false, false, false, false, true, true, true]);
  // "2025-01-20" is beyond lastDate and must never leak into a column
  const allDates = weeks.flatMap((w) => w.dates);
  assert.ok(!allDates.includes("2025-01-20"));
});

test("heatmapWeeks defaults to empty maps and clamps to the range", () => {
  const weeks = heatmapWeeks(undefined, d("2025-01-05"), d("2025-01-11"), "2025-01-05");
  assert.equal(weeks.length, 1);
  assert.deepEqual(weeks[0].counts, [0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(weeks[0].futures, [false, true, true, true, true, true, true]);
});

test("heatmapMonthLabels marks the week where each month begins", () => {
  const weeks = heatmapWeeks({}, d("2025-01-26"), d("2025-02-23"), "2025-12-31");
  assert.equal(weeks.length, 5);
  assert.deepEqual(heatmapMonthLabels(weeks), [
    { monthIndex: 0, week: 0 },
    { monthIndex: 1, week: 1 },
  ]);
});

test("heatmapMonthLabels emits a single label when the span is within one month", () => {
  const weeks = heatmapWeeks({}, d("2025-01-05"), d("2025-01-18"), "2025-12-31");
  assert.deepEqual(heatmapMonthLabels(weeks), [{ monthIndex: 0, week: 0 }]);
});
