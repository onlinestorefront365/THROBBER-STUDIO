# Throbber Studio

A browser-based studio for designing a 3D crystal-ball loading indicator. It renders a glass orb, a pulsing core, orbital rings with rigid-body physics, and a magnetised particle field in WebGL, and lets you tune all of it live from a side panel. Designs are saved in the browser and can be exported as a single offline HTML file.

The app has no build step to run it. It is static HTML, CSS, and JavaScript with libraries loaded from CDNs. Node is needed only to run the tests and to regenerate the single-file build.

## Using it now

It is tested in Chromium, the engine behind Chrome and Edge, both locally and in CI. Firefox, Safari, and mobile browsers are untested. It needs a connection to load its libraries from CDNs, and a browser with WebGL.

**Fastest: open one file.** `dist/throbber-studio.html` is the whole studio in a single file.

1. Download it from the repository: open the file on GitHub, then use the download button (the raw file is shown as text, not run).
2. Double-click it. It opens in your browser from disk, with no server.
3. Design the throbber, then use the Export tab. Everything works from this file, including **Download HTML**.

**From a clone.**

```bash
git clone https://github.com/onlinestorefront365/throbber-studio.git
cd throbber-studio
python3 -m http.server 8000
```

Open <http://localhost:8000>. Any static file server works. Opening `index.html` directly also works; only **Download HTML** needs a server there, and the studio says so if you try it.

**Get a loader out of it.** Export tab, **Download HTML**, then embed the file where you need the loader (see [Standalone export](#standalone-export)).

Your design is saved in your browser, per browser and per file location, so a design made in the single file and one made on `localhost` are separate.

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

The export needs the source of the studio's drawing scripts. `dist/throbber-studio.html` carries them inside the page, so it can always export. `index.html` has to fetch them, which browsers only allow over `http` or `https`; opened from disk, its button reports that and points to the single file.

## Project structure

```
index.html              Markup and CDN includes
dist/throbber-studio.html  Single-file build of the studio (generated, committed)
scripts/build.js        Generates the single file: inlines css/ and js/ into index.html
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

## Single-file build

```bash
npm run build
```

writes `dist/throbber-studio.html` by inlining `css/styles.css` and every script in `js/` into `index.html`. It uses only Node's standard library. The CDN libraries stay as links, so the file still needs a connection when opened.

The generated file is committed so it can be downloaded without Node. A test fails if it is out of date with the sources, so run `npm run build` and commit the result after any change to `index.html`, `css/`, or `js/`.

## Testing

```bash
npm install
npx playwright install chromium
npm test
```

The tests drive the studio in headless Chromium. They cover loading, the panel controls, saving and restoring a design, rejection of invalid saved data, reset, the standalone export played with the network blocked, the single-file build opened from disk, and that the committed build is current.

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

Tested in Chromium (Chrome and Edge). Firefox, Safari, and mobile browsers should work, since the code uses standard WebGL and DOM APIs, but they have not been tried. Audio starts only after a click on the audio button, as browsers require a user gesture.

## Known issues

- **It is not usable offline.** The studio and the single-file build load Tailwind, Three.js, Tone.js, Lucide, and fonts from CDNs. Only an exported page is self-contained.
- **Two dependencies are unpinned.** Lucide loads `@latest` and Tailwind loads the Play CDN build, so an upstream release can change or break the page, and can fail the tests without any change in this repo. The Play CDN is also not intended for production use.
- **Copy uses `document.execCommand('copy')`,** which is deprecated.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
