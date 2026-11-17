import { config, themes } from './state.js';

export const STATE_VERSION = 1;

export const STATE_SCHEMA = {};

export function pickState(source) {}

export const DEFAULT_STATE = pickState(config);

export function saveState() {}

export function flushState() {}

export function loadState() {}

export function resetState() {}

// Also registers the panel and pagehide listeners at module load, as js/persist.js does.
