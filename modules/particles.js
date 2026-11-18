import { config, getActiveColors } from './state.js';
import { throbberGroup } from './scene.js';

// rebuildParticles reassigns both; importers see the new values through the live bindings
export let particleSystem = null;
export let particleData = [];

export function rebuildParticles() {}
