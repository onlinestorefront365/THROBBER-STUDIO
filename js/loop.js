// Main Physics & Animation Loop
const clock = new THREE.Clock();
const tmpNormalA = new THREE.Vector3();
const tmpNormalB = new THREE.Vector3();
const tmpTorque = new THREE.Vector3();
const tmpSep = new THREE.Vector3();
const tmpForce = new THREE.Vector3();
const tmpLocalPt = new THREE.Vector3();
const tmpWorldPt = new THREE.Vector3();
const tmpDelta = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const rawDelta = clock.getDelta();
  const delta = Math.min(rawDelta, 0.05);
  const elapsedTime = clock.getElapsedTime();

  // Core & Shadow Pulse
  const pulse = 1 + Math.sin(elapsedTime * 3.0 * config.speed) * 0.12;
  if (config.showCore) {
    coreGroup.scale.setScalar(pulse);
    plasmaCore.rotation.y += delta * 0.8 * config.speed;
    prismCore.rotation.y -= delta * 0.9 * config.speed;
    prismCore.rotation.x += delta * 0.4 * config.speed;
    corePointLight.intensity = 2.4 + Math.sin(elapsedTime * 3.0 * config.speed) * 0.8;
  }

  if (config.showShadow) {
    const shadowScale = 1 + Math.sin(elapsedTime * 3.0 * config.speed) * 0.14;
    floorShadow.scale.set(shadowScale, shadowScale, 1);
  }

  // Ring-Ring Synthetic Magnetic Dipole Attraction, Repulsion & Torque
  if (ringMeshes.length > 0) {
    const activeMag = Math.abs(config.ringMagnetism) > 0.001;

    for (let i = 0; i < ringMeshes.length; i++) {
      const ringA = ringMeshes[i];
      if (!ringA.visible) continue;
      const massA = Math.max(0.2, config.ringMass[i] || 1.0);
      tmpNormalA.set(0, 0, 1).applyQuaternion(ringA.quaternion).applyEuler(ringA.userData.inertialFrame.rotation);

      if (activeMag) {
        for (let j = i + 1; j < ringMeshes.length; j++) {
          const ringB = ringMeshes[j];
          if (!ringB.visible) continue;
          const massB = Math.max(0.2, config.ringMass[j] || 1.0);
          tmpNormalB.set(0, 0, 1).applyQuaternion(ringB.quaternion).applyEuler(ringB.userData.inertialFrame.rotation);

          // 1. Dipole alignment / anti-alignment torque
          tmpTorque.crossVectors(tmpNormalA, tmpNormalB).multiplyScalar(config.ringMagnetism * delta * 0.35);
          ringA.userData.inertialFrame.rotation.x += tmpTorque.x / massA;
          ringA.userData.inertialFrame.rotation.y += tmpTorque.y / massA;
          ringB.userData.inertialFrame.rotation.x -= tmpTorque.x / massB;
          ringB.userData.inertialFrame.rotation.y -= tmpTorque.y / massB;

          // 2. Translational magnetic attraction (+) or repulsion (-)
          tmpSep.subVectors(ringB.userData.pos, ringA.userData.pos);
          let dist = tmpSep.length();
          if (dist < 0.02) {
            tmpSep.copy(tmpNormalA).sub(tmpNormalB);
            if (tmpSep.lengthSq() < 1e-4) {
              tmpSep.set(Math.cos(i * 2.1), Math.sin(i * 2.1), 0.35);
            }
            dist = tmpSep.length();
          }
          tmpSep.divideScalar(dist);

          const polarity = tmpNormalA.dot(tmpNormalB);
          const polaritySign = Math.abs(polarity) > 0.15 ? Math.sign(polarity) : 1;
          const magStrength = config.ringMagnetism * polaritySign * 1.45 / (dist * dist + 0.35);

          tmpForce.copy(tmpSep).multiplyScalar(magStrength * delta);
          ringA.userData.vel.addScaledVector(tmpForce, 1 / massA);
          ringB.userData.vel.addScaledVector(tmpForce, -1 / massB);
        }
      }

      // Central harmonic restoring potential
      const springK = activeMag ? 1.8 : 6.0;
      ringA.userData.vel.addScaledVector(ringA.userData.pos, -springK * delta);
      ringA.userData.vel.multiplyScalar(0.92);
      ringA.userData.pos.addScaledVector(ringA.userData.vel, delta);
      ringA.userData.pos.clampLength(0, 1.35);
      ringA.userData.inertialFrame.position.copy(ringA.userData.pos);
    }
  }

  // Per-Ring Rigid-Body Rotation & Tennis Racket Theorem (Dzhanibekov Effect)
  ringMeshes.forEach((ring, idx) => {
    if (!ring.visible) return;

    const targetMomentumScale = (config.ringSpeeds[idx] !== undefined ? config.ringSpeeds[idx] : 1.0) * config.rotationSpeed;
    const mass = Math.max(0.2, config.ringMass[idx] !== undefined ? config.ringMass[idx] : 1.0);
    const radius = Math.max(0.4, config.ringSizes[idx] || 1.0);
    const migrationRate = config.ringAxisMigration[idx] || 0.0;
    const useTennisRacket = config.ringTennisRacket[idx];
    const flipPeriod = Math.max(1.0, config.ringFlipPeriod[idx] || 4.5);
    const inertialFrame = ring.userData.inertialFrame;
    const ud = ring.userData;

    // 1. Controlled migration of the inertial axis by radians (with optional seeded quasi-periodic organic walk)
    if (migrationRate > 0.0001) {
      const theta = elapsedTime * migrationRate + ud.driftPhaseZ;
      if (config.driftOrganicWalk) {
        const f1 = ud.driftFreqRatio1;
        const f2 = ud.driftFreqRatio2;
        const waveX = Math.sin(elapsedTime * migrationRate * f1 + ud.driftPhaseX) * 0.55 +
                      Math.cos(elapsedTime * migrationRate * 0.61803398875 + ud.driftPhaseY) * 0.30;
        const waveY = Math.cos(elapsedTime * migrationRate * f2 + ud.driftPhaseY) * 0.55 +
                      Math.sin(elapsedTime * migrationRate * 0.38196601125 + ud.driftPhaseZ) * 0.30;
        inertialFrame.rotation.z = ud.baseTiltZ + theta;
        inertialFrame.rotation.x = ud.baseTiltX + waveX;
        inertialFrame.rotation.y = waveY;
      } else {
        const phi = elapsedTime * migrationRate * 0.61803398875 + ud.driftPhaseX;
        inertialFrame.rotation.z = ud.baseTiltZ + theta;
        inertialFrame.rotation.x = ud.baseTiltX + Math.sin(phi) * 0.65;
        inertialFrame.rotation.y = Math.cos(phi * 0.5 + ud.driftPhaseY) * 0.65;
      }
    } else if (Math.abs(config.ringMagnetism) <= 0.001) {
      inertialFrame.rotation.z = ud.baseTiltZ;
      inertialFrame.rotation.x = ud.baseTiltX;
      inertialFrame.rotation.y = 0;
    }

    // 2. Principal moments of inertia directly proportional to Mass * Radius^2
    const baseI = 0.5 * mass * radius * radius;
    const I1 = baseI * 1.00; // Intermediate coin-flip axis (X)
    const I2 = baseI * 0.65; // Minor axis (Y)
    const I3 = baseI * 1.85; // Major ring normal axis (Z)

    const targetL = Math.abs(targetMomentumScale) * 1.6;
    const signL = Math.sign(targetMomentumScale) || 1;
    const omega = ud.omega;

    if (targetL < 1e-4) {
      omega.set(0, 0, 0);
      return;
    }

    if (Math.sign(omega.x) !== 0 && Math.sign(omega.x) !== signL && !useTennisRacket) {
      omega.x = Math.abs(omega.x) * signL;
    }

    if (useTennisRacket) {
      const inertialFlipPeriod = flipPeriod * Math.sqrt(mass);
      ud.flipTimer += delta;
      if (ud.flipTimer >= inertialFlipPeriod) {
        ud.flipTimer = 0;
        if (Math.hypot(omega.y, omega.z) < 0.05) {
          omega.y += (0.09 * signL) / Math.sqrt(mass);
          omega.z += 0.045 / Math.sqrt(mass);
        }
      }
      stepEulerRK4(omega, I1, I2, I3, delta);
    } else {
      omega.set(signL * (targetL / I1), 0, 0);
    }

    // Enforce exact conservation of angular momentum magnitude |L|
    const currentL = Math.hypot(I1 * omega.x, I2 * omega.y, I3 * omega.z);
    if (currentL > 1e-6) {
      omega.multiplyScalar(targetL / currentL);
    } else {
      omega.set(signL * (targetL / I1), 0, 0);
    }

    // Integrate body orientation quaternion
    const omegaMag = omega.length();
    if (omegaMag > 1e-6) {
      const axis = omega.clone().divideScalar(omegaMag);
      const dq = new THREE.Quaternion().setFromAxisAngle(axis, omegaMag * delta);
      ring.quaternion.multiply(dq).normalize();
    }
  });

  // Magic Sparkle & Ring Magnetic Attraction Physics
  if (particleSystem && particleData.length > 0) {
    const posAttr = particleSystem.geometry.getAttribute('position');
    const colAttr = particleSystem.geometry.getAttribute('color');
    const baseColor = new THREE.Color(getActiveColors().core);
    const hotColor = new THREE.Color(0xffffff);

    ringsContainer.updateMatrixWorld();

    for (let i = 0; i < particleData.length; i++) {
      const p = particleData[i];

      // Gentle central harmonic confinement
      const distFromCenter = p.pos.length();
      if (distFromCenter > 0.01) {
        const springForce = (p.baseRadius - distFromCenter) * 1.4;
        p.vel.addScaledVector(p.pos, (springForce / distFromCenter) * delta);
      }

      // Subtle swirl
      p.vel.x += -p.pos.z * 0.25 * delta;
      p.vel.z += p.pos.x * 0.25 * delta;

      let minRingDist = 999;

      // Sparkle-Ring Magnetic Attraction
      if (Math.abs(config.sparkleMagnetism) > 0.001) {
        for (let rIdx = 0; rIdx < ringMeshes.length; rIdx++) {
          const ring = ringMeshes[rIdx];
          if (!ring.visible) continue;
          const radius = config.ringSizes[rIdx] || 1.35;

          tmpLocalPt.copy(p.pos);
          ring.worldToLocal(tmpLocalPt);
          const xyLen = Math.hypot(tmpLocalPt.x, tmpLocalPt.y);
          if (xyLen > 1e-4) {
            tmpLocalPt.set((tmpLocalPt.x / xyLen) * radius, (tmpLocalPt.y / xyLen) * radius, 0);
          } else {
            tmpLocalPt.set(radius, 0, 0);
          }

          tmpWorldPt.copy(tmpLocalPt);
          ring.localToWorld(tmpWorldPt);
          throbberGroup.worldToLocal(tmpWorldPt);

          tmpDelta.subVectors(tmpWorldPt, p.pos);
          const d = tmpDelta.length();
          if (d < minRingDist) minRingDist = d;

          const pull = (config.sparkleMagnetism * 1.4) / (d * d + 0.18);
          p.vel.addScaledVector(tmpDelta.normalize(), pull * delta);
        }
      }

      p.vel.multiplyScalar(0.95);
      p.pos.addScaledVector(p.vel, delta);

      posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);

      // Glow brighter white when energized near a magnetic ring
      const energize = Math.max(0, Math.min(1, 1 - minRingDist / 0.45));
      const c = baseColor.clone().lerp(hotColor, energize * 0.85);
      colAttr.setXYZ(i, c.r, c.g, c.b);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

function startScene() {
  applyConfigToScene();
  handleResize();
  animate();
}
