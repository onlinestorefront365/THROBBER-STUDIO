import { config, getActiveColors } from './state.js';
import {
  scene, camera, renderer, corePointLight, throbberGroup,
  coreGroup, plasmaCore, prismCore, floorShadow, handleResize
} from './scene.js';
import { ringsContainer, ringMeshes, stepEulerRK4 } from './rings.js';
import { particleSystem, particleData } from './particles.js';
import { applyConfigToScene } from './apply.js';

export function animate() {}

export function startScene() {}
