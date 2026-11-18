import { config } from './state.js';
import { pickState } from './persist.js';
import { showToast } from './ui.js';

// js/export.js inlines the runtime scripts by concatenating their source. Modules
// cannot be concatenated, so porting this file needs a bundling step for the runtime.

export function buildStandaloneHtml({ threeSource, runtimeSources, state }) {}

export async function downloadStandaloneHtml() {}
