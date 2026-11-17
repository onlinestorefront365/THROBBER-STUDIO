// Entry point of the ES module skeleton. index.html does not load this yet.
//
// The import graph mirrors the script order in index.html and has no cycles:
//   state <- scene <- rings, particles <- apply <- loop     (runtime, no panel access)
//   state <- persist <- ui <- export, viewport              (studio)
import { loadState } from './persist.js';
import { syncControlsFromConfig } from './ui.js';
import { startScene } from './loop.js';
import './export.js';
import './viewport.js';

// Module scripts are deferred, so the DOM and the CDN globals exist by the time
// this runs and window.onload is no longer needed.
loadState();
syncControlsFromConfig();
startScene();
