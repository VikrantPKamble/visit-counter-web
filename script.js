// Visit counter for vikrantpkamble.github.io
// Uses CountAPI (https://countapi.xyz)
// - Auto-creates the counter if missing
// - Records a hit on page load (and via the manual button for testing)
// - Stores last-visit timestamp in localStorage (per-browser)

(() => {
  // --- CONFIGURE THESE:
  const NAMESPACE = "vikrantpkamble_github_io"; // unique for your site
  const KEY = "site_visits";

  // --- DOM elements
  const countEl = document.getElementById("count");
  const lastEl = document.getElementById("last-visit");
  const badgeImg = document.getElementById("badgeImg");
  const manualBtn = document.getElementById("manualBtn");

  // --- Endpoints
  const GET_URL = `https://api.countapi.xyz/get/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(KEY)}`;
  const HIT_URL = `https://api.countapi.xyz/hit/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(KEY)}`;
  const CREATE_URL = `https://api.countapi.xyz/create?namespace=${encodeURIComponent(NAMESPACE)}&key=${encodeURIComponent(KEY)}&value=0`;

  // Helpers
  function safeSetText(el, text) {
    if (!el) return;
    el.innerText = text;
  }

  function updateBadge(value) {
    if (!badgeImg) return;
    // CountAPI has badge endpoints — we use the "hit" image pattern for a badge
    // This badge url will update automatically (it's a GET that returns an image).
    badgeImg.src = `https://api.countapi.xyz/hit/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(KEY)}/?user=${encodeURIComponent(navigator.userAgent)}`;
    badgeImg.alt = `Visits: ${value}`;
  }

  function readLastVisitFromStorage() {
    try {
      const raw = localStorage.getItem(`lastvisit_${NAMESPACE}_${KEY}`);
      if (!raw) return null;
      const t = parseInt(raw, 10);
      if (!isFinite(t)) return null;
      return t;
    } catch (e) {
      return null;
    }
  }

  function writeLastVisitToStorage(ts) {
    try {
      localStorage.setItem(`lastvisit_${NAMESPACE}_${KEY}`, String(ts));
    } catch (e) {
      // ignore storage errors
    }
  }

  async function safeFetch(url, options = {}) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      console.warn("Network error:", err);
      return null;
    }
  }

  async function ensureCounterExists() {
    // Try GET -> if not OK (404) create then return the created object
    const res = await safeFetch(GET_URL);
    if (res && res.ok) {
      const json = await res.json();
      return json;
    }

    // attempt create
    const cr = await safeFetch(CREATE_URL);
    if (cr && cr.ok) {
      try {
        const created = await cr.json();
        // created returns {namespace, key, value}
        return created;
      } catch (e) {
        // fall through to fallback
      }
    }
    return null;
  }

  async function refreshCountDisplay() {
    const res = await safeFetch(GET_URL);
    if (res && res.ok) {
      const json = await res.json();
      safeSetText(countEl, json.value ?? "—");
      updateBadge(json.value ?? 0);
      const last = readLastVisitFromStorage();
      if (last) {
        safeSetText(lastEl, new Date(last).toLocaleString());
      } else {
        safeSetText(lastEl, "This is your first visit from this browser");
      }
      return true;
    } else {
      // If GET failed try to ensure creation then try again
      const created = await ensureCounterExists();
      if (created) {
        safeSetText(countEl, created.value ?? "0");
        updateBadge(created.value ?? 0);
        const last = readLastVisitFromStorage();
        safeSetText(lastEl, last ? new Date(last).toLocaleString() : "This is your first visit from this browser");
        return true;
      }
    }
    // final fallback
    safeSetText(countEl, "N/A");
    safeSetText(lastEl, "—");
    return false;
  }

  async function recordVisit() {
    // Hit the counter (increment)
    const res = await safeFetch(HIT_URL, { method: "GET" });
    if (res && res.ok) {
      try {
        const json = await res.json();
        safeSetText(countEl, json.value ?? "—");
        updateBadge(json.value ?? 0);
        const now = Date.now();
        writeLastVisitToStorage(now);
        safeSetText(lastEl, new Date(now).toLocaleString());
        return true;
      } catch (e) {
        console.warn("Parsing hit response failed:", e);
      }
    } else {
      // maybe the counter doesn't exist -> try create then hit again
      const created = await ensureCounterExists();
      if (created) {
        // try hit once more
        const res2 = await safeFetch(HIT_URL, { method: "GET" });
        if (res2 && res2.ok) {
          const json2 = await res2.json();
          safeSetText(countEl, json2.value ?? "—");
          updateBadge(json2.value ?? 0);
          const now = Date.now();
          writeLastVisitToStorage(now);
          safeSetText(lastEl, new Date(now).toLocaleString());
          return true;
        }
      }
    }

    console.warn("Failed to record visit.");
    return false;
  }

  // --- Init on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", async () => {
    // show placeholder
    safeSetText(countEl, "Loading…");
    safeSetText(lastEl, "Loading…");

    // ensure the counter exists and show current value without increment first
    await refreshCountDisplay();

    // record a visit (increment)
    await recordVisit();

    // attach manual test button
    if (manualBtn) {
      manualBtn.addEventListener("click", async () => {
        manualBtn.disabled = true;
        manualBtn.innerText = "Recording…";
        await recordVisit();
        manualBtn.disabled = false;
        manualBtn.innerText = "Record Visit (test)";
      });
    }
  });
})();
