import { config, createMulberry32, getActiveColors } from './state.js';
import { ringMeshes, rebuildRings } from './rings.js';
import { rebuildParticles } from './particles.js';
import { applySceneColors, applySceneSettings, applyConfigToScene } from './apply.js';
import { resetState } from './persist.js';

// lucide and Tone stay globals from their CDN <script> tags.

export function syncGlobalSliders() {}

export function syncControlsFromConfig() {}

export function applyThemeColors() {}

export function applyPreset(presetName) {}

export function renderRingControlCards() {}

export function updateExportSnippet() {}

export function showToast(msg) {}

// Also registers every panel listener at module load, as js/ui.js does.
