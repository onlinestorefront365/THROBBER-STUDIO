lucide.createIcons();

// Apply Visual Theme & Preset
const SINGULARITY_CORE_COLOR = 0x05050a;

function applyCoreColor() {
  plasmaMat.color.setHex(config.preset === 'singularity' ? SINGULARITY_CORE_COLOR : getActiveColors().core);
}

function applyThemeColors() {
  const c = getActiveColors();
  document.getElementById('bg-aura').style.backgroundColor = c.hex;

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
  updateExportSnippet();
}

function applyPreset(presetName) {
  config.preset = presetName;
  document.querySelectorAll('.preset-card').forEach(btn => {
    const active = btn.dataset.preset === presetName;
    btn.classList.toggle('active', active);
    btn.classList.toggle('border-brand-500/60', active);
    btn.classList.toggle('bg-brand-500/15', active);
    btn.classList.toggle('border-white/10', !active);
    btn.classList.toggle('bg-white/5', !active);
  });

  plasmaCore.visible = false;
  prismCore.visible = false;

  if (presetName === 'classic') {
    plasmaCore.visible = true;
    config.showOrb = true;
    config.glassOpacity = 0.45;
  } else if (presetName === 'gyro') {
    plasmaCore.visible = true;
    config.showOrb = false;
    config.ringCount = Math.max(config.ringCount, 3);
  } else if (presetName === 'prism') {
    prismCore.visible = true;
    config.showOrb = true;
    config.glassOpacity = 0.35;
  } else if (presetName === 'singularity') {
    plasmaCore.visible = true;
    config.showOrb = true;
    config.glassOpacity = 0.55;
  }

  applyCoreColor();

  document.getElementById('toggle-orb').checked = config.showOrb;
  document.getElementById('input-opacity').value = config.glassOpacity;
  document.getElementById('val-opacity').textContent = config.glassOpacity.toFixed(2);
  document.getElementById('input-ring-count').value = config.ringCount;
  document.getElementById('val-ring-count').textContent = config.ringCount;

  crystalSphere.visible = config.showOrb;
  fresnelShell.visible = config.showOrb;
  glassMat.opacity = config.glassOpacity;

  rebuildRings();
}

// Dynamic Per-Ring UI Cards
function renderRingControlCards() {
  const containerEl = document.getElementById('ring-size-controls');
  containerEl.innerHTML = '';

  if (config.ringCount === 0) {
    containerEl.innerHTML = `<p class="text-[11px] text-slate-500 italic py-1">No active rings. Increase Orbital Ring Count above to add rings.</p>`;
    return;
  }

  for (let i = 0; i < config.ringCount; i++) {
    const enabled = config.ringEnabled[i] !== false;
    const sizeVal = config.ringSizes[i] || 1.35;
    const speedVal = config.ringSpeeds[i] ?? 1.0;
    const massVal = config.ringMass[i] ?? 1.0;
    const driftVal = config.ringAxisMigration[i] ?? 0.0;
    const trEnabled = config.ringTennisRacket[i] ?? false;
    const flipVal = config.ringFlipPeriod[i] ?? 4.5;

    const card = document.createElement('div');
    card.className = 'p-3 rounded-xl bg-white/5 border border-white/10 space-y-2.5';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" class="ring-enable-cb w-3.5 h-3.5 accent-brand-500 rounded" data-idx="${i}" ${enabled ? 'checked' : ''}>
          <span class="text-xs font-semibold text-white">Ring ${i + 1}</span>
        </label>
        <label class="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer" title="Dzhanibekov intermediate-axis flip">
          <input type="checkbox" class="ring-tr-cb w-3.5 h-3.5 accent-brand-500 rounded" data-idx="${i}" ${trEnabled ? 'checked' : ''}>
          <span>Tennis Racket Flip</span>
        </label>
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        <div class="space-y-1">
          <div class="flex justify-between text-[11px]">
            <span class="text-slate-400">Radius</span>
            <span class="text-brand-400 font-mono" id="r-size-${i}">${sizeVal.toFixed(2)}</span>
          </div>
          <input type="range" class="ring-size-slider w-full accent-brand-500 h-1 bg-white/10 rounded cursor-pointer" data-idx="${i}" min="0.6" max="3.0" step="0.05" value="${sizeVal}">
        </div>

        <div class="space-y-1">
          <div class="flex justify-between text-[11px]">
            <span class="text-slate-400">Momentum (L)</span>
            <span class="text-brand-400 font-mono" id="r-speed-${i}">${speedVal.toFixed(1)}</span>
          </div>
          <input type="range" class="ring-speed-slider w-full accent-brand-500 h-1 bg-white/10 rounded cursor-pointer" data-idx="${i}" min="-3.0" max="3.0" step="0.1" value="${speedVal}">
        </div>

        <div class="space-y-1">
          <div class="flex justify-between text-[11px]">
            <span class="text-slate-400">Mass (Inertia)</span>
            <span class="text-brand-400 font-mono" id="r-mass-${i}">${massVal.toFixed(1)} kg</span>
          </div>
          <input type="range" class="ring-mass-slider w-full accent-brand-500 h-1 bg-white/10 rounded cursor-pointer" data-idx="${i}" min="0.2" max="5.0" step="0.1" value="${massVal}">
        </div>

        <div class="space-y-1">
          <div class="flex justify-between items-center text-[11px]">
            <span class="text-slate-400 flex items-center gap-1">
              Axis Drift
              <button type="button" class="ring-rand-drift-btn text-brand-400 hover:text-white transition-colors" data-idx="${i}" title="Pseudo-randomize Ring ${i + 1} Axis Drift">
                <i data-lucide="dices" class="w-3 h-3"></i>
              </button>
            </span>
            <span class="text-brand-400 font-mono" id="r-drift-${i}">${driftVal.toFixed(2)} rad/s</span>
          </div>
          <input type="range" class="ring-drift-slider w-full accent-brand-500 h-1 bg-white/10 rounded cursor-pointer" data-idx="${i}" min="0.0" max="2.0" step="0.05" value="${driftVal}">
        </div>
      </div>

      <div class="space-y-1 ${trEnabled ? '' : 'opacity-40 pointer-events-none'}" id="r-flip-wrap-${i}">
        <div class="flex justify-between text-[11px]">
          <span class="text-slate-400">Flip Interval Duration</span>
          <span class="text-brand-400 font-mono" id="r-flip-${i}">${flipVal.toFixed(1)}s</span>
        </div>
        <input type="range" class="ring-flip-slider w-full accent-brand-500 h-1 bg-white/10 rounded cursor-pointer" data-idx="${i}" min="1.0" max="10.0" step="0.2" value="${flipVal}">
      </div>
    `;
    containerEl.appendChild(card);
  }

  lucide.createIcons();

  // Bind card listeners
  containerEl.querySelectorAll('.ring-enable-cb').forEach(cb => {
    cb.addEventListener('change', e => {
      const idx = parseInt(e.target.dataset.idx, 10);
      config.ringEnabled[idx] = e.target.checked;
      if (ringMeshes[idx]) ringMeshes[idx].visible = e.target.checked;
    });
  });

  containerEl.querySelectorAll('.ring-tr-cb').forEach(cb => {
    cb.addEventListener('change', e => {
      const idx = parseInt(e.target.dataset.idx, 10);
      config.ringTennisRacket[idx] = e.target.checked;
      const wrap = document.getElementById(`r-flip-wrap-${idx}`);
      if (wrap) {
        wrap.classList.toggle('opacity-40', !e.target.checked);
        wrap.classList.toggle('pointer-events-none', !e.target.checked);
      }
    });
  });

  containerEl.querySelectorAll('.ring-rand-drift-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = parseInt(e.currentTarget.dataset.idx, 10);
      const nextSeed = ((config.ringDriftSeeds[idx] || 17) * 48271 + 12345) >>> 0;
      pseudoRandomizeRingDrift(idx, nextSeed);
      showToast(`Ring ${idx + 1} axis drift randomized`);
    });
  });

  containerEl.querySelectorAll('.ring-size-slider').forEach(sl => {
    sl.addEventListener('input', e => {
      const idx = parseInt(e.target.dataset.idx, 10);
      const val = parseFloat(e.target.value);
      config.ringSizes[idx] = val;
      document.getElementById(`r-size-${idx}`).textContent = val.toFixed(2);
      if (ringMeshes[idx]) {
        ringMeshes[idx].geometry.dispose();
        ringMeshes[idx].geometry = new THREE.TorusGeometry(val, 0.022, 20, 96);
      }
    });
  });

  containerEl.querySelectorAll('.ring-speed-slider').forEach(sl => {
    sl.addEventListener('input', e => {
      const idx = parseInt(e.target.dataset.idx, 10);
      const val = parseFloat(e.target.value);
      config.ringSpeeds[idx] = val;
      document.getElementById(`r-speed-${idx}`).textContent = val.toFixed(1);
    });
  });

  containerEl.querySelectorAll('.ring-mass-slider').forEach(sl => {
    sl.addEventListener('input', e => {
      const idx = parseInt(e.target.dataset.idx, 10);
      const val = parseFloat(e.target.value);
      config.ringMass[idx] = val;
      document.getElementById(`r-mass-${idx}`).textContent = `${val.toFixed(1)} kg`;
    });
  });

  containerEl.querySelectorAll('.ring-drift-slider').forEach(sl => {
    sl.addEventListener('input', e => {
      const idx = parseInt(e.target.dataset.idx, 10);
      const val = parseFloat(e.target.value);
      config.ringAxisMigration[idx] = val;
      document.getElementById(`r-drift-${idx}`).textContent = `${val.toFixed(2)} rad/s`;
    });
  });

  containerEl.querySelectorAll('.ring-flip-slider').forEach(sl => {
    sl.addEventListener('input', e => {
      const idx = parseInt(e.target.dataset.idx, 10);
      const val = parseFloat(e.target.value);
      config.ringFlipPeriod[idx] = val;
      document.getElementById(`r-flip-${idx}`).textContent = `${val.toFixed(1)}s`;
    });
  });
}

// Export Code Generator
function updateExportSnippet() {
  const c = getActiveColors();
  const duration = (2.0 / Math.max(0.2, config.speed)).toFixed(2);
  const snippet = `<!-- 3D Crystal Ball Throbber -->
<div class="crystal-throbber" role="status" aria-label="Loading">
  <div class="crystal-orb"><div class="crystal-core"></div></div>
</div>
<style>
  .crystal-throbber { position: relative; width: 110px; height: 110px; display: grid; place-items: center; }
  .crystal-orb {
    width: 96px; height: 96px; border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35), rgba(15,10,30,0.88) 75%, ${c.hex});
    box-shadow: inset -8px -8px 18px rgba(0,0,0,0.8), 0 0 28px ${c.hex}66;
    display: grid; place-items: center;
    animation: orbPulse ${duration}s ease-in-out infinite;
  }
  .crystal-core {
    width: 44px; height: 44px; border-radius: 50%;
    background: radial-gradient(circle, #ffffff, ${c.hex} 65%, transparent);
    filter: blur(4px);
  }
  @keyframes orbPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.07); } }
</style>`;
  document.getElementById('code-output').textContent = snippet;
}

// Toast Helper
let toastTimeout;
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.remove('opacity-0', 'translate-y-4');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-4');
  }, 2200);
}

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => {
      const isMatch = b === btn;
      b.classList.toggle('active', isMatch);
      b.classList.toggle('border-brand-500', isMatch);
      b.classList.toggle('text-white', isMatch);
      b.classList.toggle('bg-white/5', isMatch);
      b.classList.toggle('border-transparent', !isMatch);
      b.classList.toggle('text-slate-400', !isMatch);
    });
    document.querySelectorAll('.tab-content').forEach(panel => {
      panel.classList.toggle('hidden', panel.id !== `tab-${target}`);
    });
  });
});

// Preset & Theme Event Listeners
document.querySelectorAll('.preset-card').forEach(card => {
  card.addEventListener('click', () => applyPreset(card.dataset.preset));
});

document.querySelectorAll('.theme-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    config.customColor = null;
    config.theme = swatch.dataset.theme;
    document.querySelectorAll('.theme-swatch').forEach(s => {
      s.classList.toggle('border-white', s === swatch);
      s.classList.toggle('border-transparent', s !== swatch);
    });
    applyThemeColors();
  });
});

document.getElementById('custom-color-picker').addEventListener('input', e => {
  config.customColor = e.target.value;
  document.querySelectorAll('.theme-swatch').forEach(s => {
    s.classList.remove('border-white');
    s.classList.add('border-transparent');
  });
  applyThemeColors();
});

// Component Visibility Toggles
document.getElementById('toggle-orb').addEventListener('change', e => {
  config.showOrb = e.target.checked;
  crystalSphere.visible = config.showOrb;
  fresnelShell.visible = config.showOrb;
});

document.getElementById('toggle-core').addEventListener('change', e => {
  config.showCore = e.target.checked;
  coreGroup.visible = config.showCore;
});

document.getElementById('toggle-shadow').addEventListener('change', e => {
  config.showShadow = e.target.checked;
  floorShadow.visible = config.showShadow;
});

// PRNG Drift Controls
document.getElementById('btn-randomize-drift').addEventListener('click', pseudoRandomizeAllDrifts);
document.getElementById('btn-zero-drift').addEventListener('click', zeroAllDrifts);
document.getElementById('toggle-drift-modulation').addEventListener('change', e => {
  config.driftOrganicWalk = e.target.checked;
});

// Global Sliders
document.getElementById('input-zoom').addEventListener('input', e => {
  config.cameraZoom = parseFloat(e.target.value);
  document.getElementById('val-zoom').textContent = config.cameraZoom.toFixed(1);
  camera.position.z = config.cameraZoom;
});

document.getElementById('input-ring-count').addEventListener('input', e => {
  config.ringCount = parseInt(e.target.value, 10);
  document.getElementById('val-ring-count').textContent = config.ringCount;
  rebuildRings();
});

document.getElementById('input-speed').addEventListener('input', e => {
  config.speed = parseFloat(e.target.value);
  document.getElementById('val-speed').textContent = `${config.speed.toFixed(1)}x`;
  updateExportSnippet();
});

document.getElementById('input-rot-speed').addEventListener('input', e => {
  config.rotationSpeed = parseFloat(e.target.value);
  document.getElementById('val-rot-speed').textContent = `${config.rotationSpeed.toFixed(1)}x`;
});

document.getElementById('input-opacity').addEventListener('input', e => {
  config.glassOpacity = parseFloat(e.target.value);
  document.getElementById('val-opacity').textContent = config.glassOpacity.toFixed(2);
  glassMat.opacity = config.glassOpacity;
});

document.getElementById('input-particles').addEventListener('input', e => {
  config.particleCount = parseInt(e.target.value, 10);
  document.getElementById('val-particles').textContent = config.particleCount;
  rebuildParticles();
});

document.getElementById('input-ring-magnet').addEventListener('input', e => {
  config.ringMagnetism = parseFloat(e.target.value);
  document.getElementById('val-ring-magnet').textContent = config.ringMagnetism.toFixed(2);
});

document.getElementById('input-sparkle-magnet').addEventListener('input', e => {
  config.sparkleMagnetism = parseFloat(e.target.value);
  document.getElementById('val-sparkle-magnet').textContent = config.sparkleMagnetism.toFixed(2);
});

// Copy Export Code
document.getElementById('export-css-btn').addEventListener('click', () => {
  const code = document.getElementById('code-output').textContent;
  const ta = document.createElement('textarea');
  ta.value = code;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('Copied CSS/HTML snippet');
});

// Ambient Audio Synth (Tone.js)
let ambientSynth = null;
document.getElementById('sound-toggle-btn').addEventListener('click', async () => {
  config.soundEnabled = !config.soundEnabled;
  const icon = document.getElementById('sound-icon');
  if (config.soundEnabled) {
    await Tone.start();
    if (!ambientSynth) {
      ambientSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 1.5, decay: 1.0, sustain: 0.6, release: 2.5 }
      }).toDestination();
      ambientSynth.volume.value = -20;
    }
    ambientSynth.triggerAttack(['C4', 'G4', 'B4']);
    icon.setAttribute('data-lucide', 'volume-2');
    icon.classList.replace('text-slate-400', 'text-brand-400');
    showToast('Ambient harmonic audio enabled');
  } else {
    if (ambientSynth) ambientSynth.releaseAll();
    icon.setAttribute('data-lucide', 'volume-x');
    icon.classList.replace('text-brand-400', 'text-slate-400');
    showToast('Audio muted');
  }
  lucide.createIcons();
});
