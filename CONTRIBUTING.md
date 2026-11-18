# Contributing to Throbber Studio

## Setup

The app needs nothing installed or built.

```bash
git clone https://github.com/onlinestorefront365/throbber-studio.git
cd throbber-studio
python3 -m http.server 8000
```

Open <http://localhost:8000> and reload after each edit.

To run the tests you also need Node 22 or later:

```bash
npm install
npx playwright install chromium
npm test
```

## Ground rules

- **Rebuild the single file.** After changing `index.html`, `css/`, or `js/`, run `npm run build` and commit `dist/throbber-studio.html`. A test fails when it is stale.
- **No build step to run the app.** The studio must keep working by opening `index.html` directly. Do not add a bundler, a transpiler, a framework, or runtime npm dependencies without opening an issue to discuss it first. `package.json` holds test tooling and the single-file build script, which uses only Node's standard library.
- **Classic scripts, shared global scope.** Files in `js/` are not ES modules. Do not add `import` or `export` to them.
- **Runtime files never touch the panel.** See [Runtime and studio](#runtime-and-studio).
- **One change per pull request.** Keep bug fixes, features, and refactors separate.

## Where code goes

| You are changing | File |
| --- | --- |
| Default settings, colour themes, the PRNG | `js/state.js` |
| Renderer, camera, lights, orb, core, shadow, resize | `js/scene.js` |
| Ring geometry, the rigid-body integrator | `js/rings.js` |
| Particle creation | `js/particles.js` |
| How a setting is pushed into the scene | `js/apply.js` |
| Anything that runs every frame | `js/loop.js` |
| What is saved, and how it is validated | `js/persist.js` |
| Panel controls, presets, drift randomising, CSS snippet, audio | `js/ui.js` |
| The standalone HTML export | `js/export.js` |
| Toolbar, drag, zoom | `js/viewport.js` |
| Boot order | `js/main.js` |
| The single-file build | `scripts/build.js` |
| Static markup | `index.html` |
| CSS that Tailwind utilities cannot express | `css/styles.css` |

### Script load order

Scripts load in the order listed at the bottom of `index.html`:

```
state → scene → rings → particles → apply → loop → persist → ui → export → viewport → main
```

Code that executes at load time, meaning top-level statements outside any function, may only use names defined in the same file or an earlier one. Function bodies may reference later files, because nothing is called until `window.onload` in `main.js`.

If you add a file, add its `<script>` tag at the correct position, add a matching module to `modules/`, and update the structure list in `README.md`.

### Runtime and studio

The first six files (`state` through `loop`) are the runtime. The standalone export inlines their source, unchanged, into a page that contains only a `#canvas-container` element. A runtime file therefore must not:

- read or write any panel element, the toast, or `localStorage`
- call a function defined in a studio file (`persist`, `ui`, `export`, `viewport`, `main`)
- use Tailwind, Lucide, or Tone

If you add a runtime file, add it to `RUNTIME_SCRIPTS` in `js/export.js`. The export test fails if a runtime file breaks these rules along a code path the exported page runs.

## Code style

- Two-space indentation, semicolons, single quotes.
- `const` by default, `let` when reassigned, never `var`.
- All user-adjustable state belongs on the `config` object. Panel handlers write to `config`, `apply.js` pushes it into the scene, and the animation loop reads from it. Do not keep a second copy of a setting elsewhere.
- Top-level names are global across every script. Give them specific names.
- Do not allocate inside the per-particle or per-ring-pair loops in `animate()`. Reuse the `tmp*` vectors declared at the top of `loop.js`.
- Dispose of Three.js geometries, materials, and textures when you replace them.
- Style with Tailwind utility classes in the markup. Use `css/styles.css` only for what utilities cannot do.
- Comment the reason for something non-obvious, not what the code does.

## Common changes

**Add a colour theme**

1. Add an entry to `themes` in `js/state.js` with `core`, `glow`, `ring`, and `hex`.
2. Add a `.theme-swatch` button with a matching `data-theme` to the palette grid in `index.html`.

**Add an archetype**

1. Add a `.preset-card` button with a new `data-preset` value in `index.html`.
2. Add a branch for that value in `applyPreset()` in `js/ui.js`.
3. Add the value to the `preset` validator in `STATE_SCHEMA` in `js/persist.js`.
4. Create any new meshes in `js/scene.js` and set their visibility in `applySceneSettings()` in `js/apply.js`.

**Add a global slider**

1. Add the default to `config` in `js/state.js`.
2. Add a validator for the key to `STATE_SCHEMA` in `js/persist.js`, with the same range as the slider. A key without a validator is never saved or exported.
3. Add the `<input id="input-NAME">` and its `<span id="val-NAME">` label to `index.html`.
4. Add a row to `GLOBAL_SLIDERS` in `js/ui.js`. The row wires the listener, the label, and restoring the control from a saved design.
5. Read the value from `config` wherever it applies.

**Add a per-ring control**

1. Add a six-element array to `config` in `js/state.js`.
2. Add an `isRingArrayOf(...)` validator for it to `STATE_SCHEMA` in `js/persist.js`.
3. Add the input to the card template in `renderRingControlCards()` in `js/ui.js`, and bind its listener in the same function.
4. Read `config.yourArray[idx]` in the ring loop in `js/loop.js`.

**Change what a saved setting means**

If you rename a persisted key, change its type, or change what its values mean, bump `STATE_VERSION` in `js/persist.js`. Saves from the old version are then ignored. Adding a new key, or widening a range, does not need a bump.

## Testing

Run `npm test` before opening a pull request. Add or extend a test in `tests/studio.spec.js` for any change to behaviour; a new persisted setting should appear in the reload test.

A new file in `js/` is picked up by the single-file build automatically, because it inlines whatever `index.html` references.

The tests cannot judge how the result looks. Also check by hand, with the browser console open:

- Your change looks right on all four archetypes and several colour themes.
- Drag rotates, scroll zooms, and the camera reset restores both.
- The layout works at a phone-width viewport and at desktop width.
- A downloaded standalone page looks like the design it was exported from.

Test in at least one Chromium-based browser and one of Firefox or Safari.

If your change touches the animation loop, compare frame rate before and after at 6 rings and 400 particles.

### Continuous integration

`.github/workflows/ci.yml` runs `npm test` in headless Chromium on every pull request and on every push to `main`. On failure it uploads screenshots as the `test-results` artifact.

The tests load the same CDN libraries the app does, so a CDN outage or a breaking release of an unpinned library fails CI without a change in this repo. Check that before debugging your own change.

## ES module skeleton

`modules/` mirrors `js/` as ES modules, with real `import` and `export` lines and empty function bodies. It is a map for a future migration, not running code. Keep it in step when you add or remove a file, or add, rename, or remove a function that another file calls.

## Commits and pull requests

- Write commit subjects in the imperative mood, 72 characters or fewer: `Fix core colour after leaving Void Singularity`.
- In the pull request description, say what changed and why, and list what you tested.
- Include a screenshot or short recording for any visible change.
- Update `README.md` when you change behaviour, file layout, or dependencies. If you fix something listed under Known issues, remove it from that list.

## Reporting bugs

Open an issue with:

- Browser and version, operating system, and device
- Steps to reproduce, starting from a fresh page load after pressing Reset to defaults
- What you expected and what happened
- Console errors, if any
- For drift-related bugs, the value shown next to "Deterministic Seed"
