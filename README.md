# Throbber Studio

A browser-based studio for designing a 3D crystal-ball loading indicator. It renders a glass orb, a pulsing core, orbital rings with rigid-body physics, and a magnetised particle field in WebGL, and lets you tune all of it live from a side panel. Designs are saved in the browser and can be exported as a single offline HTML file.

The app has no build step and nothing to install. It is static HTML, CSS, and JavaScript with libraries loaded from CDNs. Node is needed only to run the tests.

## Quick start

```bash
git clone https://github.com/onlinestorefront365/throbber-studio.git
cd throbber-studio
python3 -m http.server 8000
```

Open <http://localhost:8000>. Any static file server works. Opening `index.html` directly from disk also works, except for the standalone HTML export, which needs a server.

An internet connection is required on first load, because Tailwind, Three.js, Tone.js, Lucide, and the fonts come from CDNs.

## What you can do

**Style tab**

- Four archetypes: Mystic Crystal, Celestial Gyro, Prism Octahedron, Void Singularity
- Ten colour themes, plus a custom colour picker
- Show or hide the glass orb, the core, and the floor shadow
- Reset the design to its defaults

**Rings & Physics tab**

- 0 to 6 orbital rings, each with its own radius, angular momentum, mass, and axis drift
- Per-ring "Tennis Racket Flip" (the Dzhanibekov effect) with an adjustable flip interval
- Seeded, reproducible axis-drift randomisation, per ring or for all rings at once
- Camera distance, pulse frequency, global angular momentum, glass opacity, particle count
- Ring-to-ring magnetic coupling (attract or repel) and particle-to-ring attraction

**Export tab**

- **Standalone 3D Page** downloads `crystal-throbber.html`, a single file that plays the current design with every setting. See [Standalone export](#standalone-export).
- **CSS-only Snippet** copies a small HTML and CSS loader. It is an approximation: a flat orb that reflects only the colour and pulse frequency.

**Viewport**

- Drag to rotate, scroll to zoom
- Toolbar: ambient audio toggle, camera reset, and a button that hides the control panel to give the viewport the full window

## Saved designs

Every change in the panel is saved to the browser's `localStorage` automatically and restored on the next visit. Saving is per browser and per origin; it does not sync between devices.

- Writes are debounced by 300 ms, so dragging a slider causes one write, and a pending write is flushed when the page is closed.
- Each save carries a version number. A save from a different version is ignored and the defaults are used.
- Each value is validated when loaded. A value that is missing, of the wrong type, or out of range falls back to its default without discarding the rest of the save.
- The audio toggle and the drag rotation of the viewport are not saved.

**Reset to defaults** on the Style tab restores the original design.

## Standalone export

**Download HTML** produces one file of about 630 KB that contains Three.js, the scene and physics code, and the current settings. It makes no network requests, so it works offline, from disk, or inside an `<iframe>`:

```html
<iframe src="crystal-throbber.html" title="Loading" style="width: 240px; height: 240px; border: 0;"></iframe>
```

The exported page runs the same scene and physics code as the studio, with the same settings. Ring and particle motion is simulated live, so it is not frame-identical to what was on screen at export time. The page has a dark background (`#05060a`), which you can change in its `<style>` block.

The export reads the studio's own script files, which browsers only allow over `http` or `https`. If the studio was opened from disk, the button reports that it needs a web server.

## Project structure

```
index.html              Markup and CDN includes
css/styles.css          Scrollbar and glass-panel styles (everything else is Tailwind utilities)
js/tailwind.config.js   Tailwind CDN theme: fonts and brand colours

Runtime: draws the throbber, never touches the panel, and is inlined into exports
js/state.js             Seeded PRNG, the `config` state object, theme palettes
js/scene.js             Renderer, camera, lights, glass orb, core meshes, floor shadow, resize
js/rings.js             Ring construction and the Euler rigid-body integrator
js/particles.js         Particle system construction
js/apply.js             Applies `config` to the scene: colours, visibility, camera
js/loop.js              Per-frame physics and render loop

Studio: the panel and everything around it
js/persist.js           Saved designs: schema, validation, debounced save, load, reset
js/ui.js                Panel controls, presets, ring cards, drift randomising, CSS snippet,
                        toast, tabs, audio
js/export.js            Standalone HTML export
js/viewport.js          Toolbar actions, drag and wheel controls
js/main.js              Application boot

modules/                ES module skeleton of the files above (not loaded yet)
tests/studio.spec.js    Browser tests
.github/workflows/ci.yml  Runs the tests on pull requests and on pushes to main
```

### How the scripts fit together

The files in `js/` are classic scripts, not ES modules. They share one global scope and are loaded in the order listed in `index.html`. Code that runs at load time can only use what earlier files define; functions may reference later files as long as they are not called until boot (`window.onload` in `main.js`).

This keeps the app free of a bundler and lets `index.html` run from `file://`, which ES modules do not allow.

All mutable settings live in the single `config` object in `state.js`. Panel handlers write to it, `apply.js` pushes it into the scene, and the animation loop reads from it every frame.

The split between runtime and studio files matters: the standalone export inlines the runtime files verbatim, so they must work on a page that contains nothing but a `#canvas-container` element.

### ES module skeleton

`modules/` holds an ES module version of the file layout: one module per script, with the final `import` and `export` lines and empty function bodies. It documents the dependency graph a migration would follow and is not loaded by `index.html`.

Two things change in a real migration. The app would no longer open from `file://`, and the standalone export could no longer inline the runtime by concatenating source files, so it would need a bundling step.

## How the simulation works

- **Ring rotation.** Each ring is a rigid body with three distinct principal moments of inertia. Its angular velocity is advanced with a fourth-order Runge-Kutta step of Euler's rigid-body equations, then rescaled so the magnitude of angular momentum stays exactly at the value set by the sliders.
- **Tennis Racket Flip.** Rings spin about their intermediate axis, which is unstable. With the flip enabled, a small periodic perturbation lets that instability grow into a full flip. With it disabled, the ring spins steadily about that axis.
- **Axis drift.** The frame each ring sits in rotates over time. With "Organic Drift Walk" on, the motion is a sum of sinusoids at incommensurate frequencies whose phases come from a seeded Mulberry32 generator.
- **Magnetic coupling.** Each pair of visible rings exchanges an alignment torque and a softened inverse-square force along the line between them. A spring pulls every ring back towards the centre.
- **Particles.** Each particle is held near its starting radius by a spring, swirled around the vertical axis, and pulled towards the nearest point on every visible ring. Particles brighten towards white as they approach a ring.

These are stylised models chosen to look good, not a physically accurate simulation.

## Testing

```bash
npm install
npx playwright install chromium
npm test
```

The tests drive the studio in headless Chromium. They cover loading, the panel controls, saving and restoring a design, rejection of invalid saved data, reset, and the standalone export played with the network blocked.

The same tests run in GitHub Actions on every pull request and on every push to `main`.

## Dependencies

All loaded from CDNs in `index.html`:

| Library | Version | Purpose |
| --- | --- | --- |
| [Tailwind CSS](https://tailwindcss.com) (Play CDN) | latest | Styling |
| [Three.js](https://threejs.org) | r128 | WebGL rendering |
| [Tone.js](https://tonejs.github.io) | 14.8.49 | Ambient audio |
| [Lucide](https://lucide.dev) | latest | Icons |
| Inter, JetBrains Mono (Google Fonts) | n/a | Typography |

Development only: [@playwright/test](https://playwright.dev) 1.63.0, installed through npm.

## Browser support

Any current desktop or mobile browser with WebGL. Audio starts only after a click on the audio button, as browsers require a user gesture.

## Known issues

- **Two dependencies are unpinned.** Lucide loads `@latest` and Tailwind loads the Play CDN build, so an upstream release can change or break the page, and can fail the tests without any change in this repo. The Play CDN is also not intended for production use.
- **The floor shadow is always purple.** Its texture does not follow the selected colour theme.
- **Drift phases change when rings are rebuilt.** After randomising axis drift, changing the ring count, reloading, or exporting gives each ring a different drift phase for the same seed. Drift rates are preserved.
- **Copy uses `document.execCommand('copy')`,** which is deprecated.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
