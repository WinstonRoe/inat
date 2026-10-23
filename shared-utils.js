// Shared utilities for iNaturalist tools

// ===== URL Parameter Management =====

function updateUrlWithUsername(username) {
  const url = new URL(window.location);
  if (username) {
    url.searchParams.set("user", username);
  } else {
    url.searchParams.delete("user");
  }
  window.history.replaceState({}, "", url);
}

function updateUrlWithPlace(placeId, placeName) {
  const url = new URL(window.location);
  if (placeId && placeName) {
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("place", placeName);
  } else {
    url.searchParams.delete("place_id");
    url.searchParams.delete("place");
  }
  window.history.replaceState({}, "", url);
}

function updateUrlWithTaxon(taxonId, taxonName) {
  const url = new URL(window.location);
  if (taxonId && taxonName) {
    url.searchParams.set("taxon_id", taxonId);
    url.searchParams.set("taxon", taxonName);
  } else {
    url.searchParams.delete("taxon_id");
    url.searchParams.delete("taxon");
  }
  window.history.replaceState({}, "", url);
}

function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    username: urlParams.get("user"),
    placeId: urlParams.get("place_id"),
    placeName: urlParams.get("place"),
    taxonId: urlParams.get("taxon_id"),
    taxonName: urlParams.get("taxon"),
  };
}

// ===== localStorage Management =====

function saveUsername(username) {
  if (username) {
    localStorage.setItem("inatUsername", username);
  } else {
    localStorage.removeItem("inatUsername");
  }
}

function getSavedUsername() {
  return localStorage.getItem("inatUsername");
}

function savePlace(placeId, placeName) {
  if (placeId && placeName) {
    localStorage.setItem("inatPlaceId", placeId);
    localStorage.setItem("inatPlaceName", placeName);
  } else {
    localStorage.removeItem("inatPlaceId");
    localStorage.removeItem("inatPlaceName");
  }
}

function getSavedPlace() {
  return {
    id: localStorage.getItem("inatPlaceId"),
    name: localStorage.getItem("inatPlaceName"),
  };
}

function saveLanguage(language) {
  localStorage.setItem("inatLanguage", language);
}

function getSavedLanguage() {
  return localStorage.getItem("inatLanguage");
}

// ===== Error Handling =====

function showError(elementOrId, message) {
  const element =
    typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
  if (element) {
    element.textContent = message;
    element.style.display = "block";
    element.classList.remove("welcome-message");
    element.classList.add("show");
  }
}

function hideError(elementOrId) {
  const element =
    typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
  if (element) {
    element.style.display = "none";
    element.classList.remove("show", "welcome-message");
  }
}

// Reuses the page's error element for friendly empty states (e.g. brand-new
// users with zero observations), so they get a welcome instead of a red box.
// Styles are injected here because pages define their error boxes in per-page
// CSS; !important is needed to beat the ID selectors some pages use.
function showWelcome(elementOrId, message) {
  const element =
    typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
  if (!element) return;
  if (!document.getElementById("welcomeMessageStyles")) {
    const style = document.createElement("style");
    style.id = "welcomeMessageStyles";
    style.textContent = `
      .welcome-message.show {
        background: #f1f8e9 !important;
        color: #33691e !important;
        border: 1px solid #c5e1a5 !important;
      }
      html.dark-mode .welcome-message.show {
        background: #26331f !important;
        color: #c5e1a5 !important;
        border-color: #4a5d3a !important;
      }
    `;
    document.head.appendChild(style);
  }
  element.textContent = message;
  element.style.display = "block";
  element.classList.add("show", "welcome-message");
}

// ===== Progress Updates =====

function updateProgress(percent, text, currentCheck) {
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const currentCheckEl = document.getElementById("currentCheck");

  if (progressBar) progressBar.style.width = percent + "%";
  if (progressText) progressText.textContent = text;
  if (currentCheckEl) currentCheckEl.textContent = currentCheck || "";
}

// ===== Feedback Button (Crisp chat) =====

const CRISP_WEBSITE_ID = "69e5f089-9f10-41ef-a438-5d254be7b317";

// Loads Crisp, hides its default launcher, and wires the "Send feedback"
// button to open the chat. Replaces the per-page inline boilerplate.
function initFeedbackButton(buttonId = "feedbackBtn") {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  window.$crisp = window.$crisp || [];
  window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;
  const s = document.createElement("script");
  s.src = "https://client.crisp.chat/l.js";
  s.async = 1;
  document.getElementsByTagName("head")[0].appendChild(s);

  $crisp.push(["do", "chat:hide"]);
  $crisp.push([
    "on",
    "chat:closed",
    function () {
      $crisp.push(["do", "chat:hide"]);
    },
  ]);

  // Crisp boots asynchronously; clicks made before it's ready sit in the
  // command queue for a few seconds, so show a spinner on the button until
  // the session is loaded and the queued chat:open actually fires.
  let crispReady = false;
  const spinnerStyle = document.createElement("style");
  spinnerStyle.textContent =
    ".feedback-spinner{display:inline-block;width:12px;height:12px;" +
    "border:2px solid rgba(255,255,255,0.4);border-top-color:#fff;" +
    "border-radius:50%;margin-right:6px;vertical-align:-2px;" +
    "animation:feedback-spin 0.7s linear infinite}" +
    "@keyframes feedback-spin{to{transform:rotate(360deg)}}";
  document.head.appendChild(spinnerStyle);

  function removeSpinner() {
    const spin = btn.querySelector(".feedback-spinner");
    if (spin) spin.remove();
  }

  $crisp.push([
    "on",
    "session:loaded",
    function () {
      crispReady = true;
      removeSpinner();
    },
  ]);

  btn.addEventListener("click", () => {
    $crisp.push(["do", "chat:show"]);
    $crisp.push(["do", "chat:open"]);
    if (!crispReady && !btn.querySelector(".feedback-spinner")) {
      const spin = document.createElement("span");
      spin.className = "feedback-spinner";
      btn.prepend(spin);
      // If Crisp never loads (offline, blocked), don't spin forever
      setTimeout(removeSpinner, 10000);
    }
  });
}

// ===== Service Worker =====

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
  }
}

// ===== API Helpers =====

// Read the shared iNaturalist token (set by draft.html / notifications.html or
// the paste-token fallback on any page) so requests are counted against the
// user's account budget rather than an anonymous IP — substantially higher
// limit. Returns null when running outside the browser or no token present.
function getToken() {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("inat_jwt_token") || null;
    }
  } catch {}
  return null;
}

// Fetch JSON from the API. iNaturalist answers 429 when a client sends too
// many requests per minute; wait and retry (honoring Retry-After when sent)
// instead of failing the whole run. Server errors are retried the same way.
// If a JWT is stored, it is sent so the request is counted against the user's
// (higher) rate budget rather than an anonymous IP.
async function fetchJSON(url, { retries = 4, baseDelayMs = 1500 } = {}) {
  const headers = { Accept: "application/json" };
  const token = getToken();
  if (token) headers.Authorization = token;
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { headers });
    if (response.ok) {
      return response.json();
    }
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= retries) {
      const hint =
        response.status === 429
          ? " (iNaturalist rate limit reached, please wait a minute and try again)"
          : "";
      throw new Error(`HTTP ${response.status}${hint}`);
    }
    const retryAfter = Number(response.headers.get("Retry-After"));
    const waitMs = retryAfter > 0 ? retryAfter * 1000 : baseDelayMs * 2 ** attempt;
    await sleep(waitMs);
  }
}

// ===== HTML Helpers =====

// Escape a value for safe interpolation into HTML (element content or
// double-quoted attribute values). Pure string version so it also works
// outside the DOM (tests) and on non-string API values.
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ===== Timing Helpers =====

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===== Date Range Helpers =====

// Presets offered by the date range filter. The offset is subtracted from
// today to get the start of the range; "all" applies no date filter and
// "custom" is driven by the two date inputs instead.
const DATE_RANGE_PRESETS = {
  all: {},
  "30d": { days: 30 },
  "3m": { months: 3 },
  "12m": { months: 12 },
  custom: {},
};

function isDateRangePreset(preset) {
  return Object.prototype.hasOwnProperty.call(DATE_RANGE_PRESETS, preset);
}

// Format a Date as the YYYY-MM-DD string the iNaturalist API expects for
// d1/d2. Uses local calendar fields — toISOString() would report the
// previous day for anyone behind UTC.
function formatDateParam(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Subtract whole months, clamping the day to the end of the target month so
// that 3 months before May 31 is Feb 28 rather than spilling into March.
function subtractMonths(date, months) {
  const result = new Date(date.getFullYear(), date.getMonth(), 1);
  result.setMonth(result.getMonth() - months);
  const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(date.getDate(), lastDayOfMonth));
  return result;
}

// Resolve the selected preset (or the custom from/to values) into the
// iNaturalist d1/d2 params. Either side may be null, meaning "unbounded".
function resolveDateRange(preset, customFrom, customTo, today = new Date()) {
  if (preset === "custom") {
    return { d1: customFrom || null, d2: customTo || null };
  }

  const offset = isDateRangePreset(preset) ? DATE_RANGE_PRESETS[preset] : null;
  if (!offset || (!offset.days && !offset.months)) {
    return { d1: null, d2: null };
  }

  const start = offset.days
    ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset.days)
    : subtractMonths(today, offset.months);

  return { d1: formatDateParam(start), d2: formatDateParam(today) };
}

// Build the &d1=...&d2=... query fragment for a resolved range.
function buildDateRangeParams(range) {
  if (!range) return "";
  let params = "";
  if (range.d1) params += `&d1=${encodeURIComponent(range.d1)}`;
  if (range.d2) params += `&d2=${encodeURIComponent(range.d2)}`;
  return params;
}

// ===== Init helpers =====

// Initialize username from URL or localStorage
function initUsername(inputElement) {
  const { username: urlUsername } = getUrlParams();
  const savedUsername = getSavedUsername();

  if (urlUsername) {
    if (inputElement) inputElement.value = urlUsername;
    saveUsername(urlUsername);
    return urlUsername;
  } else if (savedUsername) {
    if (inputElement) inputElement.value = savedUsername;
    return savedUsername;
  }
  return null;
}

// Initialize place from URL or localStorage
function initPlace(inputElement, idInputElement) {
  const { placeId: urlPlaceId, placeName: urlPlaceName } = getUrlParams();
  const savedPlace = getSavedPlace();

  if (urlPlaceId && urlPlaceName) {
    if (inputElement) inputElement.value = urlPlaceName;
    if (idInputElement) idInputElement.value = urlPlaceId;
    savePlace(urlPlaceId, urlPlaceName);
    return { id: urlPlaceId, name: urlPlaceName };
  } else if (savedPlace.id && savedPlace.name) {
    if (inputElement) inputElement.value = savedPlace.name;
    if (idInputElement) idInputElement.value = savedPlace.id;
    return savedPlace;
  }
  return null;
}

// Initialize language select from localStorage
function initLanguage(selectElement) {
  const savedLanguage = getSavedLanguage();
  if (savedLanguage && selectElement) {
    selectElement.value = savedLanguage;
  }
  if (selectElement) {
    selectElement.addEventListener("change", () => {
      saveLanguage(selectElement.value);
    });
  }
  return savedLanguage;
}

// Fetch every record behind an API list URL, cursoring with id_above.
// Unlike page= paging this is not capped at 10,000 results.
async function fetchAllRecords(baseUrl, { perPage = 200, delayMs = 0, onPage } = {}) {
  const records = [];
  let idAbove = 0;
  let total = null;
  while (true) {
    const data = await fetchJSON(
      `${baseUrl}&per_page=${perPage}&order_by=id&order=asc&id_above=${idAbove}`
    );
    const results = data.results || [];
    records.push(...results);
    // id_above also filters total_results, so only the first page reports the full total
    if (total === null) total = data.total_results;
    if (onPage) onPage(records.length, total);
    if (results.length < perPage) break;
    idAbove = results[results.length - 1].id;
    if (delayMs) await sleep(delayMs);
  }
  return records;
}

// species_counts rolls subspecies, varieties and forms up into their species.
// Collect the distinct infraspecific taxa from raw observation or
// identification records, in the same shape species_counts results are mapped
// to, so they can be checked as taxa in their own right.
function collectInfraspecificTaxa(records) {
  const byId = new Map();
  for (const record of records) {
    const taxon = record.taxon;
    if (!taxon || byId.has(taxon.id)) continue;
    byId.set(taxon.id, {
      taxon: {
        id: taxon.id,
        name: taxon.name,
        rank: taxon.rank,
        observations_count: taxon.observations_count || 0,
        preferred_common_name: taxon.preferred_common_name,
        default_photo: taxon.default_photo,
      },
    });
  }
  return Array.from(byId.values());
}

// The identifications endpoint returns bare taxa (id and rank only). Fill in
// names, photos and counts from /taxa, which accepts up to 30 ids per call.
async function hydrateTaxa(taxaList, apiBase, { chunkSize = 30, locale, delayMs = 0 } = {}) {
  const byId = new Map(taxaList.map((item) => [item.taxon.id, item]));
  const ids = Array.from(byId.keys());
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    let url = `${apiBase}/taxa/${chunk.join(",")}?per_page=${chunkSize}`;
    if (locale && locale !== "en") url += `&locale=${locale}`;
    const data = await fetchJSON(url);
    for (const taxon of data.results || []) {
      const item = byId.get(taxon.id);
      if (!item) continue;
      item.taxon = {
        id: taxon.id,
        name: taxon.name,
        rank: taxon.rank,
        observations_count: taxon.observations_count || 0,
        preferred_common_name: taxon.preferred_common_name,
        default_photo: taxon.default_photo,
      };
    }
    if (delayMs && i + chunkSize < ids.length) await sleep(delayMs);
  }
  return Array.from(byId.values());
}

// Ranks above species that species_counts can fold into a finer taxon the
// user also recorded (a genus into its subgenus). Queried one rank at a time
// there is nothing to fold into, so those taxa surface.
const FOLDED_RANKS = ["subgenus", "genus", "complex", "tribe", "subfamily", "family"];
// Family (rank_level 30); anything coarser is not worth a first-observer check.
const FOLDED_MAX_RANK_LEVEL = 30;

// ===== Activity Heatmap helpers =====

// Bucket an observation count for a single day into a 0-4 intensity level,
// matching the per-year Activity Calendar scale (0 / 1 / 2-4 / 5-9 / 10+).
function heatmapIntensity(count) {
  const n = Number(count) || 0;
  if (n === 0) return 0;
  if (n === 1) return 1;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  return 4;
}

const _localDayStr = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const _parseDayStr = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Lay out a day-count map into GitHub-style columns: each returned week is a
// column of 7 days (Sunday first). dayData keys are "YYYY-MM-DD"; today is the
// same-shaped string for the current calendar day. Days after today carry the
// real date but a zeroed count and futures[i] = true so the UI can dim them.
// Pure/local-date math, so deterministic and DST-safe.
function heatmapWeeks(dayData, firstDate, lastDate, todayStr) {
  const data = dayData || {};
  const weeks = [];
  const end = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  let cursor = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate());
  while (cursor <= end) {
    const dates = [];
    const counts = [];
    const futures = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + i);
      const key = _localDayStr(day);
      const future = key > todayStr;
      dates.push(key);
      counts.push(future ? 0 : data[key] || 0);
      futures.push(future);
    }
    weeks.push({ dates, counts, futures });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
  }
  return weeks;
}

// Find the week where each month begins (based on the column's Sunday), so a
// month label can sit above the right column.
function heatmapMonthLabels(weeks) {
  const labels = [];
  let last = -1;
  weeks.forEach((week, i) => {
    if (!week.dates || !week.dates.length) return;
    const month = _parseDayStr(week.dates[0]).getMonth();
    if (month !== last) {
      labels.push({ monthIndex: month, week: i });
      last = month;
    }
  });
  return labels;
}

// Build the 12 x 24 month-by-hour observation matrix from
// /observations/histogram?interval=hour buckets. Keys look like
// "2022-01-19T10:00:00Z" (or "...T10:00Z"). Returns null when no bucket
// parsed, so the UI can tell "no timed obs" from "empty range".
function seasonHourMatrix(hourBuckets) {
  const src = hourBuckets && typeof hourBuckets === "object" ? hourBuckets : {};
  const matrix = [];
  for (let m = 0; m < 12; m++) matrix.push(new Array(24).fill(0));
  let total = 0;
  let peak = 0;
  for (const key of Object.keys(src)) {
    const count = Number(src[key]) || 0;
    if (count <= 0 || !key) continue;
    // YYYY-MM-DDTHH:MM...; month at index 5-6, hour at index 11-12.
    const month = parseInt(key.slice(5, 7), 10) - 1;
    const hour = parseInt(key.slice(11, 13), 10);
    if (Number.isNaN(month) || Number.isNaN(hour) || month < 0 || month > 11 || hour < 0 || hour > 23) continue;
    matrix[month][hour] += count;
    total += count;
    if (matrix[month][hour] > peak) peak = matrix[month][hour];
  }
  return { matrix, total, peak };
}

// Normalize a cell count to a 0-4 level on the user's own scale (peak cell = 4)
// rather than the absolute Activity Calendar scale. A user with 3 timed obs
// spread over 3 hours should still read as a heat grid, not a sea of "1"s.
function seasonHourIntensity(count, peak) {
  if (!peak || peak <= 0) return 0;
  if (count <= 0) return 0;
  const frac = count / peak;
  if (frac <= 0.15) return 1;
  if (frac <= 0.35) return 2;
  if (frac <= 0.65) return 3;
  return 4;
}

// Map species_counts results to the taxon shape the checker pages use.
function mapSpeciesCountTaxa(results) {
  return (results || [])
    .filter((item) => item.taxon)
    .map((item) => ({
      taxon: {
        id: item.taxon.id,
        name: item.taxon.name,
        rank: item.taxon.rank,
        observations_count: item.taxon.observations_count || 0,
        preferred_common_name: item.taxon.preferred_common_name,
        default_photo: item.taxon.default_photo,
      },
    }));
}

// Walk every page of a species_counts URL (page-based paging).
async function fetchSpeciesCountPages(baseUrl, { perPage = 500, delayMs = 0, onPage } = {}) {
  const results = [];
  let page = 1;
  let totalPages = 1;
  do {
    const data = await fetchJSON(`${baseUrl}&per_page=${perPage}&page=${page}`);
    results.push(...(data.results || []));
    totalPages = Math.ceil((data.total_results || 0) / perPage);
    if (onPage) onPage(page, totalPages);
    page++;
    if (page <= totalPages && delayMs) await sleep(delayMs);
  } while (page <= totalPages);
  return results;
}

// species_counts folds a coarser taxon into a finer one the user also
// observed and rolls subspecies up into species. The observations/taxonomy
// endpoint lists every taxon with direct observations, so pick out the ones
// species_counts left out. Names and photos are filled in later, only for the
// taxa that turn out to be firsts.
function collectTaxonomyExtras(rows, knownIds) {
  const known = new Set(knownIds);
  return (rows || [])
    .filter(
      (row) =>
        row.direct_obs_count > 0 && row.rank_level <= FOLDED_MAX_RANK_LEVEL && !known.has(row.id)
    )
    .map((row) => ({
      taxon: {
        id: row.id,
        name: row.name,
        rank: row.rank,
        observations_count: 0,
        preferred_common_name: undefined,
        default_photo: undefined,
        needsHydration: true,
      },
    }));
}

// ===== Easy-to-identify helpers =====

// A "stuck" observation is one that is not yet research grade but can still
// reach it. (A casual observation isn't verifiable, so it can't.)
const STUCK_QUALITY_GRADE = "needs_id";

// Ease score = share of verifiable observations for a taxon that the community
// confirms to research grade, as 0-100 (rounded). 0 when there is no verifiable
// data so we never divide by zero — no data reads as "hard", never "easy".
function computeEase(researchTotal, verifiableTotal) {
  if (!verifiableTotal || verifiableTotal <= 0) return 0;
  const eased = (researchTotal / verifiableTotal) * 100;
  return Math.max(0, Math.min(100, Math.round(eased)));
}

// Bucket an ease % into a coarse label for the stat-chips filter.
function easeLabel(pct) {
  if (pct >= 90) return "very-easy";
  if (pct >= 70) return "easy";
  if (pct >= 40) return "medium";
  return "hard";
}

// Count verifiable vs research-grade observations for one taxon. We only need
// the totals, so one /observations/quality_grades?taxon_id=X call returns the
// grade breakdown (research + needs_id) in a single response — halving the API
// load versus two per_page=1 probes. This is the "easy to identify" signal: a
// species the community reliably confirms is a quick win.
async function fetchTaxonEase(apiBase, taxonId, { delayMs = 0 } = {}) {
  const data = await fetchJSON(
    `${apiBase}/observations/quality_grades?taxon_id=${taxonId}&verifiable=true`
  );
  if (delayMs) await sleep(delayMs);
  let verifiable = 0;
  let research = 0;
  for (const row of data.results || []) {
    const count = Number(row.count) || 0;
    verifiable += count;
    if (row.quality_grade === "research") research += count;
  }
  return { taxonId, verifiable, research, ease: computeEase(research, verifiable) };
}

// --- Guess the Species daily game --------------------------------------------

// FNV-1a 32-bit string hash: tiny, fast, deterministic, no crypto. Returns an
// unsigned 32-bit integer. Same string -> same hash on every run and browser.
function fnv1aHash(str) {
  let h = 0x811c9dc5;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    // h = (h * 0x01000193) >>> 0, expanded so it is valid in 32-bit JS math.
    h =
      (h +
        ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 16) + (h << 24))) >>>
      0;
  }
  return h >>> 0;
}

// Pick `n` DISTINCT indices from [0, poolLen) EXCLUDING `correctIdx`,
// deterministically from `seed`. Used by Guess the Species to build a stable
// 4-option choice set (1 correct + 3 wrong) for a given puzzle slot so that a
// hard-refresh mid-session resumes with the same options.
//
// Returns as many distinct indices as the pool allows (up to `n`). If the
// pool is too small to supply `n` distractors the result is shorter but
// always valid; callers should fall back to a smaller choice set.
function pickChoices(seed, poolLen, correctIdx, n) {
  const size = Math.max(0, Math.floor(Number(poolLen)) || 0);
  const want = Math.max(0, Math.min(Math.floor(Number(n)) || 0, size - 1));
  if (size < 2 || want <= 0) return [];
  const correct = Math.floor(Number(correctIdx));
  const out = [];
  const seen = new Set([correct]);
  let guard = 0;
  const maxGuard = want * (size + 8) + 64;
  while (out.length < want && guard < maxGuard) {
    guard++;
    const idx = fnv1aHash(`${seed}#${guard}`) % size;
    if (seen.has(idx)) continue;
    seen.add(idx);
    out.push(idx);
  }
  return out;
}

// Session key for a given place. "global" when no place is selected,
// otherwise "place-<id>". Two different places (and one place vs. none)
// each get their own independent session in localStorage.
function sessionKeyForPlace(placeId) {
  if (!placeId) return "global";
  return "place-" + String(placeId);
}

// Normalize a taxon name for comparison: trim, lowercase, strip diacritics,
// collapse internal whitespace. Empty / non-string input -> "".
function normalizeTaxonName(s) {
  if (typeof s !== "string") return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// A guess is correct if it matches the scientific name or the preferred
// common name (both normalized). Empty guesses are never correct.
function isCorrectGuess(guess, sciName, commonName) {
  const g = normalizeTaxonName(guess);
  if (!g) return false;
  return (
    (normalizeTaxonName(sciName) === g) ||
    (commonName ? normalizeTaxonName(commonName) === g : false)
  );
}

// Allow unit tests (Node) to import the pure helpers; no-op in the browser.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    heatmapIntensity,
    heatmapWeeks,
    heatmapMonthLabels,
    seasonHourMatrix,
    seasonHourIntensity,
    escapeHtml,
    sleep,
    getToken,
    fetchJSON,
    fetchAllRecords,
    collectInfraspecificTaxa,
    hydrateTaxa,
    FOLDED_RANKS,
    mapSpeciesCountTaxa,
    fetchSpeciesCountPages,
    collectTaxonomyExtras,
    DATE_RANGE_PRESETS,
    isDateRangePreset,
    formatDateParam,
    subtractMonths,
    resolveDateRange,
    buildDateRangeParams,
    STUCK_QUALITY_GRADE,
    computeEase,
    easeLabel,
    fetchTaxonEase,
    fnv1aHash,
    pickChoices,
    sessionKeyForPlace,
    normalizeTaxonName,
    isCorrectGuess,
  };
}
