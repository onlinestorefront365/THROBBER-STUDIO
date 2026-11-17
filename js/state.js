// Mulberry32 Deterministic PRNG
function createMulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Application State Configuration
const config = {
  preset: 'classic',
  theme: 'mystic',
  customColor: null,
  cameraZoom: 8.2,
  showOrb: true,
  showCore: true,
  showShadow: true,
  speed: 1.0,
  rotationSpeed: 1.0,
  glassOpacity: 0.45,
  particleCount: 180,
  ringCount: 3,
  ringEnabled: [true, true, true, true, true, true],
  ringSizes: [1.35, 1.55, 1.75, 1.95, 2.15, 2.35],
  ringSpeeds: [1.2, -0.9, 1.5, -1.1, 0.8, -1.3],
  ringMass: [1.0, 1.4, 0.8, 1.8, 1.2, 2.0],
  ringAxisMigration: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  ringDriftSeeds: [13, 37, 71, 113, 179, 233],
  driftOrganicWalk: true,
  prngSeed: 104729,
  ringTennisRacket: [true, false, true, false, true, false],
  ringFlipPeriod: [4.5, 5.2, 3.8, 6.0, 4.2, 5.5],
  ringMagnetism: 0.25,
  sparkleMagnetism: 0.80,
  soundEnabled: false
};

const themes = {
  mystic:  { core: 0xf472b6, glow: 0xa855f7, ring: 0xc084fc, hex: '#a855f7' },
  cyan:    { core: 0x67e8f9, glow: 0x06b6d4, ring: 0x22d3ee, hex: '#06b6d4' },
  emerald: { core: 0x6ee7b7, glow: 0x10b981, ring: 0x34d399, hex: '#10b981' },
  crimson: { core: 0xfda4af, glow: 0xf43f5e, ring: 0xfb7185, hex: '#f43f5e' },
  solar:   { core: 0xfde68a, glow: 0xf59e0b, ring: 0xfbbf24, hex: '#f59e0b' },
  neon:    { core: 0xff77c8, glow: 0xff0080, ring: 0xd946ef, hex: '#ff0080' },
  plasma:  { core: 0x93c5fd, glow: 0x3b82f6, ring: 0x60a5fa, hex: '#3b82f6' },
  toxic:   { core: 0xd9f99d, glow: 0x84cc16, ring: 0xa3e635, hex: '#84cc16' },
  void:    { core: 0xcbd5e1, glow: 0x475569, ring: 0x94a3b8, hex: '#64748b' },
  gold:    { core: 0xfef9c3, glow: 0xeab308, ring: 0xfacc15, hex: '#eab308' }
};

function getActiveColors() {
  if (config.customColor) {
    const c = new THREE.Color(config.customColor);
    const coreCol = c.clone().lerp(new THREE.Color(0xffffff), 0.35);
    return {
      core: coreCol.getHex(),
      glow: c.getHex(),
      ring: c.getHex(),
      hex: config.customColor
    };
  }
  return themes[config.theme] || themes.mystic;
}
