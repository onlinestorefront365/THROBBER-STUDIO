// 5. Magic Sparkles Particle System
let particleSystem = null;
let particleData = [];

function rebuildParticles() {
  if (particleSystem) {
    throbberGroup.remove(particleSystem);
    particleSystem.geometry.dispose();
    particleSystem.material.dispose();
    particleSystem = null;
  }

  const count = config.particleCount;
  particleData = [];
  if (count <= 0) return;

  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const activeCol = new THREE.Color(getActiveColors().core);

  for (let i = 0; i < count; i++) {
    const r = 0.35 + Math.random() * 1.45;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    colors[i * 3] = activeCol.r;
    colors[i * 3 + 1] = activeCol.g;
    colors[i * 3 + 2] = activeCol.b;

    particleData.push({
      pos: new THREE.Vector3(x, y, z),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4
      ),
      baseRadius: r,
      phase: Math.random() * Math.PI * 2
    });
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.042,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  particleSystem = new THREE.Points(geo, mat);
  throbberGroup.add(particleSystem);
}
