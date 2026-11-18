// Toolbar Actions
document.getElementById('reset-camera-btn').addEventListener('click', () => {
  throbberGroup.rotation.set(0, 0, 0);
  config.cameraZoom = DEFAULT_STATE.cameraZoom;
  camera.position.set(0, 0.45, config.cameraZoom);
  syncGlobalSliders();
  saveState();
  showToast('Camera reset');
});

document.getElementById('fullscreen-preview-btn').addEventListener('click', () => {
  const panel = document.getElementById('controls-panel');
  panel.classList.toggle('hidden');
  setTimeout(handleResize, 50);
});

// Pointer Drag Orbit & Wheel Zoom Controls
let isDragging = false;
let prevPointer = { x: 0, y: 0 };

container.addEventListener('pointerdown', e => {
  isDragging = true;
  prevPointer = { x: e.clientX, y: e.clientY };
});

window.addEventListener('pointermove', e => {
  if (!isDragging) return;
  const dx = e.clientX - prevPointer.x;
  const dy = e.clientY - prevPointer.y;
  throbberGroup.rotation.y += dx * 0.008;
  throbberGroup.rotation.x += dy * 0.008;
  prevPointer = { x: e.clientX, y: e.clientY };
});

window.addEventListener('pointerup', () => {
  isDragging = false;
});

container.addEventListener('wheel', e => {
  e.preventDefault();
  config.cameraZoom = Math.min(15.0, Math.max(4.5, config.cameraZoom + e.deltaY * 0.005));
  camera.position.z = config.cameraZoom;
  syncGlobalSliders();
  saveState();
}, { passive: false });
