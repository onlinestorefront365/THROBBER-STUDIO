const { test, expect } = require('@playwright/test');

const STORAGE_KEY = 'throbber-studio:state';

// Fails the test on any uncaught exception or console error
function trackErrors(page) {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

async function openStudio(page) {
  await page.goto('/index.html');
  await page.waitForFunction(() => typeof renderer !== 'undefined' && renderer.info.render.frame > 0);
}

async function setSlider(page, selector, value) {
  await page.locator(selector).fill(String(value));
}

const readSavedConfig = page => page.evaluate(key => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw).config : null;
}, STORAGE_KEY);

const coreColor = page => page.evaluate(() => plasmaMat.color.getHexString());

test('loads and renders the default design', async ({ page }) => {
  const errors = trackErrors(page);
  await openStudio(page);

  await expect(page.locator('#canvas-container canvas')).toHaveCount(1);
  expect(await page.evaluate(() => ringMeshes.length)).toBe(3);
  expect(await page.evaluate(() => particleData.length)).toBe(180);
  expect(errors).toEqual([]);
});

test('panel controls update the design', async ({ page }) => {
  const errors = trackErrors(page);
  await openStudio(page);

  await page.click('[data-tab="customize"]');
  await expect(page.locator('#ring-size-controls > div')).toHaveCount(3);

  await setSlider(page, '#input-ring-count', 5);
  await expect(page.locator('#val-ring-count')).toHaveText('5');
  await expect(page.locator('#ring-size-controls > div')).toHaveCount(5);
  expect(await page.evaluate(() => ringMeshes.length)).toBe(5);

  await page.click('#btn-randomize-drift');
  await expect(page.locator('#val-prng-seed')).not.toHaveText('104729');
  expect(await page.evaluate(() => config.ringAxisMigration.every(rate => rate > 0))).toBe(true);

  await page.click('#btn-zero-drift');
  await expect(page.locator('#r-drift-0')).toHaveText('0.00 rad/s');

  await page.click('[data-tab="presets"]');
  await page.click('[data-preset="gyro"]');
  await expect(page.locator('#toggle-orb')).not.toBeChecked();
  expect(await page.evaluate(() => crystalSphere.visible)).toBe(false);

  await page.click('[data-preset="prism"]');
  expect(await page.evaluate(() => prismCore.visible && !plasmaCore.visible)).toBe(true);
  await expect(page.locator('#val-opacity')).toHaveText('0.35');

  await page.click('[data-theme="cyan"]');
  await page.click('[data-tab="export"]');
  await expect(page.locator('#code-output')).toContainText('#06b6d4');

  expect(errors).toEqual([]);
});

test('Void Singularity keeps its dark core only while selected', async ({ page }) => {
  await openStudio(page);

  await page.click('[data-preset="singularity"]');
  expect(await coreColor(page)).toBe('05050a');

  await page.click('[data-theme="cyan"]');
  expect(await coreColor(page)).toBe('05050a');

  await page.click('[data-preset="classic"]');
  expect(await coreColor(page)).toBe('67e8f9');
});

test('a design survives a reload', async ({ page }) => {
  const errors = trackErrors(page);
  await openStudio(page);

  await page.click('[data-preset="singularity"]');
  await page.click('[data-theme="emerald"]');
  await page.uncheck('#toggle-shadow');
  await page.click('[data-tab="customize"]');
  await setSlider(page, '#input-ring-count', 5);
  await setSlider(page, '#input-particles', 60);
  await setSlider(page, '.ring-size-slider[data-idx="1"]', 2.5);
  await page.uncheck('.ring-enable-cb[data-idx="0"]');

  await expect.poll(async () => (await readSavedConfig(page))?.ringEnabled[0]).toBe(false);
  await page.reload();
  await page.waitForFunction(() => renderer.info.render.frame > 0);

  expect(await page.evaluate(() => ({
    preset: config.preset,
    theme: config.theme,
    showShadow: config.showShadow,
    ringCount: config.ringCount,
    particleCount: config.particleCount,
    ringSize: config.ringSizes[1],
    ringEnabled: config.ringEnabled[0]
  }))).toEqual({
    preset: 'singularity',
    theme: 'emerald',
    showShadow: false,
    ringCount: 5,
    particleCount: 60,
    ringSize: 2.5,
    ringEnabled: false
  });

  // The scene and the panel both reflect the restored design
  expect(await coreColor(page)).toBe('05050a');
  expect(await page.evaluate(() => ({
    rings: ringMeshes.length,
    particles: particleData.length,
    shadow: floorShadow.visible,
    firstRing: ringMeshes[0].visible
  }))).toEqual({ rings: 5, particles: 60, shadow: false, firstRing: false });

  await expect(page.locator('[data-preset="singularity"]')).toHaveClass(/active/);
  await expect(page.locator('[data-theme="emerald"]')).toHaveClass(/border-white/);
  await expect(page.locator('[data-theme="mystic"]')).not.toHaveClass(/border-white/);
  await expect(page.locator('#toggle-shadow')).not.toBeChecked();
  await expect(page.locator('#val-ring-count')).toHaveText('5');
  await expect(page.locator('#input-particles')).toHaveValue('60');
  await page.click('[data-tab="customize"]');
  await expect(page.locator('#r-size-1')).toHaveText('2.50');
  await expect(page.locator('.ring-enable-cb[data-idx="0"]')).not.toBeChecked();

  expect(errors).toEqual([]);
});

test('rapid changes are written once, after the debounce', async ({ page }) => {
  await openStudio(page);
  await page.evaluate(() => {
    window.__writes = 0;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (...args) {
      window.__writes += 1;
      return setItem.apply(this, args);
    };
  });

  const writesDuringBurst = await page.evaluate(() => {
    const slider = document.getElementById('input-speed');
    for (const value of ['1.2', '1.4', '1.6', '1.8', '2']) {
      slider.value = value;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return window.__writes;
  });
  expect(writesDuringBurst).toBe(0);

  await expect.poll(async () => (await readSavedConfig(page))?.speed).toBe(2);
  expect(await page.evaluate(() => window.__writes)).toBe(1);
});

test('a change made just before leaving the page is still saved', async ({ page }) => {
  await openStudio(page);
  await page.click('[data-theme="toxic"]');
  await page.reload();
  await page.waitForFunction(() => renderer.info.render.frame > 0);
  expect(await page.evaluate(() => config.theme)).toBe('toxic');
});

test('invalid saved values fall back to defaults one key at a time', async ({ page }) => {
  const errors = trackErrors(page);
  await page.addInitScript(key => {
    localStorage.setItem(key, JSON.stringify({
      version: 1,
      config: {
        speed: 2,
        particleCount: 100,
        ringCount: 99,
        theme: 'no-such-theme',
        customColor: 'red',
        glassOpacity: '0.5',
        ringSizes: [1, 2],
        ringMass: [1, 1, 1, 1, 1, 'heavy'],
        soundEnabled: true,
        unknownKey: 'ignored'
      }
    }));
  }, STORAGE_KEY);
  await openStudio(page);

  expect(await page.evaluate(() => ({
    speed: config.speed,
    particleCount: config.particleCount,
    ringCount: config.ringCount,
    theme: config.theme,
    customColor: config.customColor,
    glassOpacity: config.glassOpacity,
    ringSizes: config.ringSizes,
    ringMass: config.ringMass,
    soundEnabled: config.soundEnabled,
    hasUnknownKey: 'unknownKey' in config
  }))).toEqual({
    speed: 2,
    particleCount: 100,
    ringCount: 3,
    theme: 'mystic',
    customColor: null,
    glassOpacity: 0.45,
    ringSizes: [1.35, 1.55, 1.75, 1.95, 2.15, 2.35],
    ringMass: [1.0, 1.4, 0.8, 1.8, 1.2, 2.0],
    soundEnabled: false,
    hasUnknownKey: false
  });
  expect(errors).toEqual([]);
});

for (const [name, stored] of [
  ['corrupt JSON', '{not json'],
  ['a different version', JSON.stringify({ version: 999, config: { ringCount: 5 } })],
  ['a non-object payload', JSON.stringify([1, 2, 3])]
]) {
  test(`a saved design with ${name} is ignored`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, stored]);
    await openStudio(page);

    expect(await page.evaluate(() => config.ringCount)).toBe(3);
    expect(await page.evaluate(() => ringMeshes.length)).toBe(3);
    expect(errors).toEqual([]);
  });
}

test('Reset to defaults restores the design and the saved copy', async ({ page }) => {
  await openStudio(page);

  await page.click('[data-preset="gyro"]');
  await page.click('[data-theme="crimson"]');
  await page.click('[data-tab="customize"]');
  await setSlider(page, '#input-ring-count', 6);
  await expect.poll(async () => (await readSavedConfig(page))?.ringCount).toBe(6);

  await page.click('[data-tab="presets"]');
  await page.click('#reset-design-btn');

  expect(await page.evaluate(() => ({
    preset: config.preset,
    theme: config.theme,
    ringCount: config.ringCount,
    showOrb: config.showOrb,
    rings: ringMeshes.length,
    orb: crystalSphere.visible
  }))).toEqual({ preset: 'classic', theme: 'mystic', ringCount: 3, showOrb: true, rings: 3, orb: true });
  await expect(page.locator('[data-preset="classic"]')).toHaveClass(/active/);
  await expect(page.locator('#toggle-orb')).toBeChecked();
  await expect.poll(async () => (await readSavedConfig(page))?.ringCount).toBe(3);
});

test('the standalone export plays the design with no network access', async ({ page, browser }, testInfo) => {
  await openStudio(page);

  await page.click('[data-preset="prism"]');
  await page.click('[data-theme="solar"]');
  await page.click('[data-tab="customize"]');
  await setSlider(page, '#input-ring-count', 4);
  await setSlider(page, '#input-particles', 80);
  await page.click('[data-tab="export"]');

  const downloadPromise = page.waitForEvent('download');
  await page.click('#export-html-btn');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('crystal-throbber.html');
  const file = testInfo.outputPath('crystal-throbber.html');
  await download.saveAs(file);

  const context = await browser.newContext();
  const requests = [];
  await context.route(/^https?:/, route => {
    requests.push(route.request().url());
    return route.abort();
  });
  const exported = await context.newPage();
  const errors = trackErrors(exported);
  await exported.goto(`file://${file}`);
  await exported.waitForFunction(() => renderer.info.render.frame > 0);

  expect(await exported.evaluate(() => ({
    preset: config.preset,
    theme: config.theme,
    rings: ringMeshes.length,
    particles: particleData.length,
    prism: prismCore.visible,
    canvases: document.querySelectorAll('#canvas-container canvas').length
  }))).toEqual({ preset: 'prism', theme: 'solar', rings: 4, particles: 80, prism: true, canvases: 1 });
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  await context.close();
});

test('the ES module skeleton loads without errors', async ({ page }) => {
  const errors = trackErrors(page);
  await openStudio(page);
  await page.evaluate(() => import('/modules/main.js').then(() => true));
  expect(errors).toEqual([]);
});
