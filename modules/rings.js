import { config, createMulberry32, getActiveColors } from './state.js';
import { throbberGroup } from './scene.js';

export let ringsContainer;

// rebuildRings reassigns this; importers see the new array through the live binding
export let ringMeshes = [];

export function stepEulerRK4(omega, I1, I2, I3, dt) {}

export function rebuildRings() {}
