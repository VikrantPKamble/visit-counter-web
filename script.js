// Simple visit counter using CountAPI (https://countapi.xyz)
// This increments and reads a counter stored under namespace:key
// You can change namespace/key to anything unique for your site.

const countEl = document.getElementById('count');
const lastEl = document.getElementById('last-visit');
const btn = document.getElementById('visitBtn');
const nsInput = document.getElementById('namespace');
const badgeImg = document.getElementById('badgeImg');

// default namespace & key (change to your repo / site slug)
let namespace = nsInput.value.trim() || 'your-unique-namespace';
let key = 'visitors'; // you can change this to page slug

nsInput.addEventListener('change', () => {
  namespace = nsInput.value.trim() || 'your-unique-namespace';
  refreshCount();
});

// Build CountAPI endpoints
function endpoint(op) {
  // using countapi.xyz; op: 'hit' or 'get' or 'create?value=0'
  return `https://api.countapi.xyz/${op}/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`;
}

// Update UI from the returned data object
function updateUI(data) {
  if (!data) return;
  countEl.innerText = data.value ?? '—';
  // store and show a last-visit timestamp (client-side)
  const last = localStorage.getItem(`lastvisit_${namespace}_${key}`);
  lastEl.innerText = last ? new Date(parseInt(last,10)).toLocaleString() : 'This is your first visit from this browser';
  // badge (image) - optional: CountAPI provides image endpoint too
  badgeImg.src = `https://api.countapi.xyz/hit/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}/?user=${encodeURIComponent(navigator.userAgent)}`;
  badgeImg.alt = `visits: ${data.value}`;
}

// Fetch the current count (does not increment)
async function refreshCount() {
  countEl.innerText = 'Loading...';
  try {
    const res = await fetch(endpoint('get'));
    if (res.ok) {
      const json = await res.json();
      updateUI(json);
    } else {
      // if not exist, create it
      await fetch(endpoint('create?value=0'));
      refreshCount();
    }
  } catch (e) {
    console.error(e);
    countEl.innerText = 'Error';
  }
}

// Record a visit (increments)
async function recordVisit() {
  btn.disabled = true;
  btn.innerText = 'Recording...';
  try {
    const res = await fetch(endpoint('hit'));
    const json = await res.json();
    // save a timestamp locally
    localStorage.setItem(`lastvisit_${namespace}_${key}`, Date.now().toString());
    updateUI(json);
  } catch (e) {
    console.error(e);
    alert('Could not record visit. Check network.');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Record Visit';
  }
}

btn.addEventListener('click', recordVisit);
refreshCount();
