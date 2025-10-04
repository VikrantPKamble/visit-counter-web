// Visit Counter for vikrantpkamble.github.io
// Using CountAPI (https://countapi.xyz)

const namespace = "vikrantpkamble-github";   // unique ID for your site
const key = "site-visits";                   // counter name

const countEl = document.getElementById("count");
const lastEl = document.getElementById("last-visit");

function endpoint(op) {
  return `https://api.countapi.xyz/${op}/${namespace}/${key}`;
}

// Update UI with count and last visit info
function updateUI(data) {
  if (!data) return;
  countEl.innerText = data.value ?? "—";

  const last = localStorage.getItem(`lastvisit_${namespace}_${key}`);
  lastEl.innerText = last
    ? new Date(parseInt(last, 10)).toLocaleString()
    : "This is your first visit from this browser";
}

// Fetch counter, create if missing
async function refreshCount() {
  try {
    const res = await fetch(endpoint("get"));
    if (res.ok) {
      updateUI(await res.json());
    } else {
      // create new counter starting at 0
      await fetch(`https://api.countapi.xyz/create?namespace=${namespace}&key=${key}&value=0`);
      refreshCount();
    }
  } catch (e) {
    console.warn("Visit counter error:", e);
    countEl.innerText = "⚠ Error loading count";
  }
}

// Record a visit (increment)
async function recordVisit() {
  try {
    const res = await fetch(endpoint("hit"));
    if (res.ok) {
      const json = await res.json();
      localStorage.setItem(`lastvisit_${namespace}_${key}`, Date.now().toString());
      updateUI(json);
    }
  } catch (e) {
    console.warn("Could not record visit:", e);
  }
}

// On load → record visit and update count
document.addEventListener("DOMContentLoaded", async () => {
  await recordVisit();
});
