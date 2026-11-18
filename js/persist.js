// Saved Design State (localStorage)
const STORAGE_KEY = 'throbber-studio:state';
// Bump when a persisted key changes meaning or shape; older saves are then ignored
const STATE_VERSION = 1;
const SAVE_DEBOUNCE_MS = 300;
const RING_SLOTS = 6;

const isBoolean = v => typeof v === 'boolean';
const isNumberIn = (min, max) => v => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isIntegerIn = (min, max) => v => Number.isInteger(v) && v >= min && v <= max;
const isRingArrayOf = isValid => v => Array.isArray(v) && v.length === RING_SLOTS && v.every(isValid);

// One validator per persisted config key. Ranges mirror the slider limits in
// index.html and in the ring cards; a key without an entry here is never saved.
const STATE_SCHEMA = {
  preset: v => ['classic', 'gyro', 'prism', 'singularity'].includes(v),
  theme: v => typeof v === 'string' && Object.prototype.hasOwnProperty.call(themes, v),
  customColor: v => v === null || (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)),
  cameraZoom: isNumberIn(4.5, 15),
  showOrb: isBoolean,
  showCore: isBoolean,
  showShadow: isBoolean,
  speed: isNumberIn(0.2, 3),
  rotationSpeed: isNumberIn(0, 3),
  glassOpacity: isNumberIn(0.05, 0.95),
  particleCount: isIntegerIn(0, 400),
  ringCount: isIntegerIn(0, RING_SLOTS),
  ringEnabled: isRingArrayOf(isBoolean),
  ringSizes: isRingArrayOf(isNumberIn(0.6, 3)),
  ringSpeeds: isRingArrayOf(isNumberIn(-3, 3)),
  ringMass: isRingArrayOf(isNumberIn(0.2, 5)),
  ringAxisMigration: isRingArrayOf(isNumberIn(0, 2)),
  ringDriftSeeds: isRingArrayOf(isIntegerIn(0, 0xFFFFFFFF)),
  driftOrganicWalk: isBoolean,
  prngSeed: isIntegerIn(0, 0xFFFFFFFF),
  ringTennisRacket: isRingArrayOf(isBoolean),
  ringFlipPeriod: isRingArrayOf(isNumberIn(1, 10)),
  ringMagnetism: isNumberIn(-2, 2),
  sparkleMagnetism: isNumberIn(-1.5, 2.5)
};

function pickState(source) {
  const picked = {};
  for (const key of Object.keys(STATE_SCHEMA)) {
    picked[key] = structuredClone(source[key]);
  }
  return picked;
}

const DEFAULT_STATE = pickState(config);

let saveTimer = null;

function writeState() {
  saveTimer = null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STATE_VERSION, config: pickState(config) }));
  } catch (err) {
    console.warn('Throbber Studio: could not save the design', err);
  }
}

// Debounced: safe to call on every input event
function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(writeState, SAVE_DEBOUNCE_MS);
}

function flushState() {
  if (saveTimer === null) return;
  clearTimeout(saveTimer);
  writeState();
}

// Copies each valid saved value into config and leaves the default for anything
// missing or invalid. Returns true when a save of the current version was read.
function loadState() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (err) {
    console.warn('Throbber Studio: ignoring an unreadable saved design', err);
    return false;
  }

  if (!saved || saved.version !== STATE_VERSION || typeof saved.config !== 'object' || saved.config === null) {
    return false;
  }

  for (const [key, isValid] of Object.entries(STATE_SCHEMA)) {
    if (Object.prototype.hasOwnProperty.call(saved.config, key) && isValid(saved.config[key])) {
      config[key] = saved.config[key];
    }
  }
  return true;
}

function resetState() {
  Object.assign(config, pickState(DEFAULT_STATE));
}

// Every design control lives in the panel, so any event there may have changed config
['input', 'change', 'click'].forEach(type => {
  document.getElementById('controls-panel').addEventListener(type, saveState);
});

window.addEventListener('pagehide', flushState);
