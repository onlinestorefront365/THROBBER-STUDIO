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
    const rng = createMulberry32(config.ringDriftSeeds[i] || (i + 1) * 97);

    ring.userData = {
      inertialFrame,
      baseTiltX: tilt[0],
      baseTiltZ: tilt[1],
      pos: new THREE.Vector3(0, 0, 0),
      vel: new THREE.Vector3(0, 0, 0),
      omega: new THREE.Vector3(speedSign * (initL / baseI), 0, 0),
      flipTimer: (i * 1.3) % 4.0,
      driftPhaseX: rng() * Math.PI * 2,
      driftPhaseY: rng() * Math.PI * 2,
      driftPhaseZ: rng() * Math.PI * 2,
      driftFreqRatio1: 0.45 + rng() * 0.75,
      driftFreqRatio2: 0.35 + rng() * 0.85
    };

    ring.visible = config.ringEnabled[i] !== false;
    inertialFrame.add(ring);
    ringsContainer.add(inertialFrame);
    ringMeshes.push(ring);
  }

  renderRingControlCards();
  updateExportSnippet();
}

// Pseudo-Randomize Axis Drift for a single ring or all rings
function pseudoRandomizeRingDrift(idx, seedVal) {
  const rng = createMulberry32(seedVal);
  // Generate pseudo-random drift speed between 0.15 and 1.85 rad/s
  const newRate = Math.round((0.15 + rng() * 1.70) * 20) / 20;
  config.ringAxisMigration[idx] = newRate;
  config.ringDriftSeeds[idx] = seedVal;

  if (ringMeshes[idx]) {
    ringMeshes[idx].userData.driftPhaseX = rng() * Math.PI * 2;
    ringMeshes[idx].userData.driftPhaseY = rng() * Math.PI * 2;
    ringMeshes[idx].userData.driftPhaseZ = rng() * Math.PI * 2;
    ringMeshes[idx].userData.driftFreqRatio1 = 0.45 + rng() * 0.75;
    ringMeshes[idx].userData.driftFreqRatio2 = 0.35 + rng() * 0.85;
  }

  const slider = document.querySelector(`.ring-drift-slider[data-idx="${idx}"]`);
  const label = document.getElementById(`r-drift-${idx}`);
  if (slider) slider.value = newRate;
  if (label) label.textContent = `${newRate.toFixed(2)} rad/s`;
}

function pseudoRandomizeAllDrifts() {
  // Advance deterministic PRNG seed
  config.prngSeed = (Math.imul(config.prngSeed, 1664525) + 1013904223) >>> 0;
  document.getElementById('val-prng-seed').textContent = config.prngSeed;

  const masterRng = createMulberry32(config.prngSeed);
  for (let i = 0; i < 6; i++) {
    const subSeed = Math.floor(masterRng() * 999999) + 1;
    pseudoRandomizeRingDrift(i, subSeed);
  }
  showToast(`Axis drift randomized (Seed ${config.prngSeed})`);
}

function zeroAllDrifts() {
  for (let i = 0; i < 6; i++) {
    config.ringAxisMigration[i] = 0.0;
    const slider = document.querySelector(`.ring-drift-slider[data-idx="${i}"]`);
    const label = document.getElementById(`r-drift-${i}`);
    if (slider) slider.value = 0;
    if (label) label.textContent = '0.00 rad/s';
  }
  showToast('Axis drift reset to 0.00 rad/s');
}
