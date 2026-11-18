// 4. Orbital Rings System (Conserved Angular Momentum & Dzhanibekov Flips)
const ringsContainer = new THREE.Group();
throbberGroup.add(ringsContainer);
let ringMeshes = [];

// 4th-order Runge-Kutta step for Euler's rigid-body equations (conserves angular momentum & kinetic energy)
function stepEulerRK4(omega, I1, I2, I3, dt) {
  const deriv = (w) => new THREE.Vector3(
    ((I2 - I3) / I1) * w.y * w.z,
    ((I3 - I1) / I2) * w.z * w.x,
    ((I1 - I2) / I3) * w.x * w.y
  );
  const k1 = deriv(omega);
  const k2 = deriv(omega.clone().addScaledVector(k1, dt * 0.5));
  const k3 = deriv(omega.clone().addScaledVector(k2, dt * 0.5));
  const k4 = deriv(omega.clone().addScaledVector(k3, dt));
  omega.addScaledVector(k1, dt / 6)
       .addScaledVector(k2, dt / 3)
       .addScaledVector(k3, dt / 3)
       .addScaledVector(k4, dt / 6);
}

// One seed gives a ring its drift rate and phases, so randomising a ring and later
// rebuilding it (ring count change, reload, export) land on the same motion.
function driftFromSeed(seed) {
  const rng = createMulberry32(seed);
  return {
    // 0.15 to 1.85 rad/s in 0.05 steps
    rate: Math.round((0.15 + rng() * 1.70) * 20) / 20,
    phaseX: rng() * Math.PI * 2,
    phaseY: rng() * Math.PI * 2,
    phaseZ: rng() * Math.PI * 2,
    freqRatio1: 0.45 + rng() * 0.75,
    freqRatio2: 0.35 + rng() * 0.85
  };
}

function rebuildRings() {
  while (ringsContainer.children.length > 0) {
    ringsContainer.remove(ringsContainer.children[0]);
  }
  ringMeshes = [];

  const colors = getActiveColors();
  const baseTilts = [
    [0.35, 0.25],
    [-0.45, 0.75],
    [0.85, -0.35],
    [-0.25, -0.85],
    [0.65, 0.55],
    [-0.75, -0.25]
  ];

  for (let i = 0; i < config.ringCount; i++) {
    const radius = config.ringSizes[i] || (1.35 + i * 0.2);
    const tube = 0.022;
    const geo = new THREE.TorusGeometry(radius, tube, 20, 96);
    const mat = new THREE.MeshStandardMaterial({
      color: colors.ring,
      emissive: colors.glow,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.75
    });

    const ring = new THREE.Mesh(geo, mat);
    const inertialFrame = new THREE.Group();
    const tilt = baseTilts[i % baseTilts.length];
    inertialFrame.rotation.x = tilt[0];
    inertialFrame.rotation.z = tilt[1];

    const mass = Math.max(0.2, config.ringMass[i] || 1.0);
    const baseI = 0.5 * mass * radius * radius;
    const speedSign = Math.sign(config.ringSpeeds[i] ?? 1.0) || 1;
    const initL = Math.abs(config.ringSpeeds[i] ?? 1.0) * config.rotationSpeed * 1.6;
    const drift = driftFromSeed(config.ringDriftSeeds[i] || (i + 1) * 97);

    ring.userData = {
      inertialFrame,
      baseTiltX: tilt[0],
      baseTiltZ: tilt[1],
      pos: new THREE.Vector3(0, 0, 0),
      vel: new THREE.Vector3(0, 0, 0),
      omega: new THREE.Vector3(speedSign * (initL / baseI), 0, 0),
      flipTimer: (i * 1.3) % 4.0,
      driftPhaseX: drift.phaseX,
      driftPhaseY: drift.phaseY,
      driftPhaseZ: drift.phaseZ,
      driftFreqRatio1: drift.freqRatio1,
      driftFreqRatio2: drift.freqRatio2
    };

    ring.visible = config.ringEnabled[i] !== false;
    inertialFrame.add(ring);
    ringsContainer.add(inertialFrame);
    ringMeshes.push(ring);
  }
}
