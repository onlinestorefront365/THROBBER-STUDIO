// Three.js Scene Initialization
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, 0.45, config.cameraZoom);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const corePointLight = new THREE.PointLight(0xa855f7, 3.0, 14);
scene.add(corePointLight);

const rimLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
rimLight1.position.set(4, 6, 5);
scene.add(rimLight1);

const rimLight2 = new THREE.DirectionalLight(0x818cf8, 0.9);
rimLight2.position.set(-5, -3, -4);
scene.add(rimLight2);

// Root Throbber Group
const throbberGroup = new THREE.Group();
scene.add(throbberGroup);

// 1. Outer Crystal Glass Sphere
const glassGeo = new THREE.SphereGeometry(1.18, 64, 64);
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: config.glassOpacity,
  roughness: 0.06,
  metalness: 0.05,
  reflectivity: 1.0,
  clearcoat: 1.0,
  clearcoatRoughness: 0.04,
  side: THREE.FrontSide,
  depthWrite: false
});
const crystalSphere = new THREE.Mesh(glassGeo, glassMat);
throbberGroup.add(crystalSphere);

// Specular Fresnel Halo Shell
const fresnelGeo = new THREE.SphereGeometry(1.19, 48, 48);
const fresnelMat = new THREE.MeshBasicMaterial({
  color: 0xc084fc,
  transparent: true,
  opacity: 0.12,
  wireframe: false,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const fresnelShell = new THREE.Mesh(fresnelGeo, fresnelMat);
throbberGroup.add(fresnelShell);

// 2. Inner Core Meshes
const coreGroup = new THREE.Group();
throbberGroup.add(coreGroup);

const plasmaGeo = new THREE.IcosahedronGeometry(0.42, 3);
const plasmaMat = new THREE.MeshStandardMaterial({
  color: 0xf472b6,
  emissive: 0xa855f7,
  emissiveIntensity: 1.8,
  roughness: 0.2,
  metalness: 0.1
});
const plasmaCore = new THREE.Mesh(plasmaGeo, plasmaMat);
coreGroup.add(plasmaCore);

const prismGeo = new THREE.OctahedronGeometry(0.48, 0);
const prismMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  emissive: 0x34d399,
  emissiveIntensity: 1.2,
  roughness: 0.1,
  metalness: 0.3,
  flatShading: true
});
const prismCore = new THREE.Mesh(prismGeo, prismMat);
prismCore.visible = false;
coreGroup.add(prismCore);

const coreAuraGeo = new THREE.SphereGeometry(0.62, 32, 32);
const coreAuraMat = new THREE.MeshBasicMaterial({
  color: 0xa855f7,
  transparent: true,
  opacity: 0.28,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const coreAura = new THREE.Mesh(coreAuraGeo, coreAuraMat);
coreGroup.add(coreAura);

// 3. Floor Shadow Disc
function createShadowTexture(glowHex = '#a855f7') {
  const glow = new THREE.Color(glowHex);
  const [r, g, b] = [glow.r, glow.g, glow.b].map(v => Math.round(v * 255));
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.55)`);
  grad.addColorStop(0.5, 'rgba(15, 10, 30, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

const shadowGeo = new THREE.PlaneGeometry(2.6, 2.6);
const shadowMat = new THREE.MeshBasicMaterial({
  map: createShadowTexture(),
  transparent: true,
  opacity: 0.85,
  depthWrite: false
});
const floorShadow = new THREE.Mesh(shadowGeo, shadowMat);
floorShadow.rotation.x = -Math.PI / 2;
floorShadow.position.y = -1.65;
scene.add(floorShadow);

// Responsive Resize
function handleResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', handleResize);
