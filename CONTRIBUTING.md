# Contributing to Throbber Studio

## Setup

There is nothing to install or build yet.

```bash
git clone https://github.com/onlinestorefront365/throbber-studio.git
cd throbber-studio
python3 -m http.server 8000
```

Open <http://localhost:8000> and reload after each edit.

## Ground rules

- **No build step.** The project must keep working by opening `index.html` directly. Do not add a bundler, a transpiler, a framework, or npm dependenci⁰es without opening an issue to discuss it first.
- **Classic scripts, shared global scope.** Files in `js/` are not ES modules. Do not add `import` or `export`.
- **One change per pull request.** Keep bug fixes, features, and refactors separate.

## Where code goes

| You are changing | File |
| --- | --- |
| Default settings, colour themes, the PRNG | `js/state.js` |
| Renderer, camera, lights, orb, core, shadow | `js/scene.js` |
| Ring geometry, the rigid-body integrator, drift randomisation | `js/rings.js` |
| Particle creation | `js/particles.js` |
| Panel controls, presets, theme application, export snippet, audio | `js/ui.js` |
| Toolbar, drag, zoom, resize | `js/viewport.js` |
| Anything that runs every frame | `js/main.js` |
| Static markup | `index.html` |
| CSS that Tailwind utilities cannot express | `css/styles.css` |

### Script load order

Scripts load in the order listed at the bottom of `index.html`:

```
state → scene → rings → particles → ui → viewport → main
```

Code that executes at load time, meaning top-level statements outside any function, may only use names defined in the same file or an earlier one. Function bodies may reference later files, because nothing is called until `window.onload` in `main.js`.

If you add a file, add its `<script>` tag at the correct position and update the structure list in `README.md`.

## Code style

- Two-space indentation, semicolons, single quotes.
- `const` by default, `let` when reassigned, never `var`.
- All user-adjustable state belongs on the `config` object. UI handlers write to `config`; the animation loop reads from it. Do not keep a second copy of a setting elsewhere.
- Do not allocate inside the per-particle or per-ring-pair loops in `animate()`. Reuse the `tmp*` vectors declared at the top of `main.js`.
- Dispose of Three.js geometries and materials when you replace them.
- Style with Tailwind utility classes in the markup. Use `css/styles.css` only for what utilities cannot do.
- Comment the reason for something non-obvious, not what the code does.

## Common changes

**Add a colour theme**

1. Add an entry to `themes` in `js/state.js` with `core`, `glow`, `ring`, and `hex`.
2. Add a `.theme-swatch` button with a matching `data-theme` to the palette grid in `index.html`.

**Add an archetype**

1. Add a `.preset-card` button with a new `data-preset` value in `index.html`.
2. Add a branch for that value in `applyPreset()` in `js/ui.js`.
3. Create any new meshes it needs in `js/scene.js`.

**Add a global control**

1. Add the default to `config` in `js/state.js`.
2. Add the input and its value label to `index.html`.
3. Add an `input` listener in `js/ui.js` that updates `config` and the label.
4. Read the value from `config` wherever it applies.

**Add a per-ring control**

1. Add a six-element array to `config` in `js/state.js`.
2. Add the input to the card template in `renderRingControlCards()` in `js/ui.js`, and bind its listener in the same function.
3. Read `config.yourArray[idx]` in the ring loop in `js/main.js`.

## Testing

There is no automated test suite. Before opening a pull request, check the following by hand with the browser console open:

- The page loads with no console errors.
- All four archetypes and several colour themes apply correctly, as does the custom colour picker.
- Ring count works at 0, 1, and 6.
- Each per-ring control changes the ring it belongs to.
- Randomize and Zero update every ring's drift slider and label.
- Drag rotates, scroll zooms, and the camera reset restores both.
- The panel-hide button resizes the viewport correctly in both directions.
- The Export tab updates when the colour or pulse frequency changes, and Copy Code works.
- The layout works at a phone-width viewport and at desktop width.

Test in at least one Chromium-based browser and one of Firefox or Safari.

If your change touches the animation loop, compare frame rate before and after at 6 rings and 400 particles.

## Commits and pull requests

- Write commit subjects in the imperative mood, 72 characters or fewer: `Fix core colour after leaving Void Singularity`.
- In the pull request description, say what changed and why, and list what you tested.
- Include a screenshot or short recording for any visible change.
- Update `README.md` when you change behaviour, file layout, or dependencies. If you fix something listed under Known issues, remove it from that list.

## Reporting bugs

Open an issue with:

- Browser and version, operating system, and device
- Steps to reproduce, starting from a fresh page load
- What you expected and what happened
- Console errors, if any
- For drift-related bugs, the value shown next to "Deterministic Seed"
