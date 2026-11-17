import { config, getActiveColors } from './state.js';
import {
  camera, corePointLight, crystalSphere, glassMat, fresnelShell, fresnelMat,
  coreGroup, plasmaCore, plasmaMat, prismCore, prismMat, coreAuraMat, floorShadow
} from './scene.js';
import { ringMeshes, rebuildRings } from './rings.js';
import { rebuildParticles } from './particles.js';

export function applyCoreColor() {}

export function applySceneColors() {}

export function applySceneSettings() {}

export function applyConfigToScene() {}
