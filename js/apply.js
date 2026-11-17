// Apply Config to the Scene
const SINGULARITY_CORE_COLOR = 0x05050a;

function applyCoreColor() {
  plasmaMat.color.setHex(config.preset === 'singularity' ? SINGULARITY_CORE_COLOR : getActiveColors().core);
}

function applySceneColors() {
  const c = getActiveColors();

  corePointLight.color.setHex(c.glow);
  fresnelMat.color.setHex(c.ring);
  applyCoreColor();
  plasmaMat.emissive.setHex(c.glow);
  prismMat.emissive.setHex(c.glow);
  coreAuraMat.color.setHex(c.glow);

  ringMeshes.forEach(ring => {
    ring.material.color.setHex(c.ring);
    ring.material.emissive.setHex(c.glow);
  });

  rebuildParticles();
}

function applySceneSettings() {
  plasmaCore.visible = config.preset !== 'prism';
  prismCore.visible = config.preset === 'prism';
  applyCoreColor();

  crystalSphere.visible = config.showOrb;
  fresnelShell.visible = config.showOrb;
  glassMat.opacity = config.glassOpacity;
  coreGroup.visible = config.showCore;
  floorShadow.visible = config.showShadow;
  camera.position.z = config.cameraZoom;
}

function applyConfigToScene() {
  applySceneSettings();
  rebuildRings();
  applySceneColors();
}
