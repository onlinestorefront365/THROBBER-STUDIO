import { config } from './state.js';

// THREE stays a global from the CDN <script> tag, as it is today.
// Everything below is created when the module loads, as js/scene.js does at its top level.
export let container, scene, camera, renderer;
export let corePointLight;
export let throbberGroup;
export let crystalSphere, glassMat, fresnelShell, fresnelMat;
export let coreGroup, plasmaCore, plasmaMat, prismCore, prismMat, coreAuraMat;
export let floorShadow;

export function handleResize() {}
