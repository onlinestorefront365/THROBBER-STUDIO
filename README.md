# Throbber Studio

A browser-based studio for designing a 3D crystal-ball loading indicator. It renders a glass orb, a pulsing core, orbital rings with rigid-body physics, and a magnetised particle field in WebGL, and lets you tune all of it live from a side panel.

No build step, no dependencies to install. It is static HTML, CSS, and JavaScript with libraries loaded from CDNs.

## Quick start

```bash
git clone https://github.com/onlinestorefront365/throbber-studio.git
cd throbber-studio
python3 -m http.server 8000
```

Open <http://localhost:8000>. Any static file server works, and so does opening `index.html` directly from disk.

An internet connection is required on first load, because Tailwind, Three.js, Tone.js, Lucide, and the fonts come from CDNs.

## What you can do

**Style tab**

- Four archetypes: Mystic Crystal, Celestial Gyro, Prism Octahedron, Void Singularity
- Ten colour themes, plus a custom colour picker
- Show or hide the glass orb, the core, and the floor shadow

**Rings & Physics tab**

- 0 to 6 orbital rings, each with its own radius, angular momentum, mass, and axis drift
- Per-ring "Tennis Racket Flip" (the Dzhanibekov effect) with an adjustable flip interval
- Seeded, reproducible axis-drift randomisation, per ring or for all rings at once
- Camera distance, pulse frequency, global angular momentum, glass opacity, particle count
- Ring-to-ring magnetic coupling (attract or repel) and particle-to-ring attraction

**Export tab**

- Copies a standalone HTML and CSS loader snippet. See [Known issues](#known-issues) for what it does and does not capture.

**Viewport**

- Drag to rotate, scroll to zoom
- Toolbar: ambient audio toggle, camera reset, and a button that hides the control panel to give the viewport the full window

## Project structure

```
index.html              Markup and CDN includes
css/styles.css          Scrollbar and glass-panel styles (everything else is Tailwind utilities)
js/tailwind.config.js   Tailwind CDN theme: fonts and brand colours
js/state.js             Seeded PRNG, the `config` state object, theme palettes
js/scene.js             Renderer, camera, lights, glass orb, core meshes, floor shadow
js/rings.js             Ring construction, Euler rigid-body integrator, axis-drift randomisation
js/particles.js         Particle system construction
js/ui.js                Theme and preset application, per-ring control cards, export snippet,
                        toast, tabs, panel event listeners, audio
js/viewport.js          Toolbar actions, drag and wheel controls, resize handling
js/main.js              Per-frame physics and render loop, application boot
```

### How the scripts fit together

The files in `js/` are classic scripts, not ES modules. They share one global scope and are loaded in the order listed in `index.html`. Code that runs at load time can only use what earlier files define; functions may reference later files as long as they are not called until boot (`window.onload` in `main.js`).

This is deliberate: it keeps the project free of a bundler and lets `index.html` run from `file://`, which ES modules do not allow.

All mutable settings live in the single `config` object in `state.js`. UI handlers write to it, and the animation loop reads from it every frame.

## How the simulation works

- **Ring rotation.** Each ring is a rigid body with three distinct principal moments of inertia. Its angular velocity is advanced with a fourth-order Runge-Kutta step of Euler's rigid-body equations, then rescaled so the magnitude of angular momentum stays exactly at the value set by the sliders.
- **Tennis Racket Flip.** Rings spin about their intermediate axis, which is unstable. With the flip enabled, a small periodic perturbation lets that instability grow into a full flip. With it disabled, the ring spins steadily about that axis.
- **Axis drift.** The frame each ring sits in rotates over time. With "Organic Drift Walk" on, the motion is a sum of sinusoids at incommensurate frequencies whose phases come from a seeded Mulberry32 generator, so a given seed always produces the same motion.
- **Magnetic coupling.** Each pair of visible rings exchanges an alignment torque and a softened inverse-square force along the line between them. A spring pulls every ring back towards the centre.
- **Particles.** Each particle is held near its starting radius by a spring, swirled around the vertical axis, and pulled towards the nearest point on every visible ring. Particles brighten towards white as they approach a ring.

These are stylised models chosen to look good, not a physically accurate simulation.

## Dependencies

All loaded from CDNs in `index.html`:

| Library | Version | Purpose |
| --- | --- | --- |
| [Tailwind CSS](https://tailwindcss.com) (Play CDN) | latest | Styling |
| [Three.js](https://threejs.org) | r128 | WebGL rendering |
| [Tone.js](https://tonejs.github.io) | 14.8.49 | Ambient audio |
| [Lucide](https://lucide.dev) | latest | Icons |
| Inter, JetBrains Mono (Google Fonts) | n/a | Typography |

## Browser support

Any current desktop or mobile browser with WebGL. Audio starts only after a click on the audio button, as browsers require a user gesture.

## Known issues

- **The export snippet is an approximation.** It is a CSS-only orb with a pulse animation that reflects the selected colour and pulse frequency. It does not reproduce the rings, particles, archetype, or any physics settings.
- **Two dependencies are unpinned.** Lucide loads `@latest` and Tailwind loads the Play CDN build, so an upstream release can change or break the page. The Play CDN is also not intended for production use.
- **Copy uses `document.execCommand('copy')`,** which is deprecated.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
