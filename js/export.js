// Standalone HTML Export
// The scripts that draw the throbber without the studio panel, in load order.
// Their source is inlined into the exported page, so they must not touch panel elements.
const RUNTIME_SCRIPTS = ['js/state.js', 'js/scene.js', 'js/rings.js', 'js/particles.js', 'js/apply.js', 'js/loop.js'];

// A literal closing tag inside inlined code would end the script element early
function escapeInlineScript(source) {
  return source.replace(/<\/script/gi, '<\\/script');
}

function buildStandaloneHtml({ threeSource, runtimeSources, state }) {
  const stateJson = JSON.stringify(state).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crystal Throbber</title>
  <style>
    html, body { margin: 0; height: 100%; overflow: hidden; background: #05060a; }
    #canvas-container { position: fixed; inset: 0; }
  </style>
</head>
<body>
  <div id="canvas-container" role="status" aria-label="Loading"></div>
  <script>${escapeInlineScript(threeSource)}</script>
  <script>
${runtimeSources.map(escapeInlineScript).join('\n')}
Object.assign(config, ${stateJson});
window.addEventListener('load', startScene);
  </script>
</body>
</html>
`;
}

// The single-file build inlines each script and tags it with data-src, so its source is
// already in the page. Otherwise the file is fetched, which needs the studio on http(s).
async function fetchText(url) {
  const inlined = document.querySelector(`[data-src="${url}"]`);
  if (inlined) return inlined.textContent;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

async function downloadStandaloneHtml() {
  let html;
  try {
    const threeUrl = document.querySelector('script[src*="three"]').src;
    const [threeSource, ...runtimeSources] = await Promise.all([threeUrl, ...RUNTIME_SCRIPTS].map(fetchText));
    html = buildStandaloneHtml({ threeSource, runtimeSources, state: pickState(config) });
  } catch (err) {
    console.warn('Throbber Studio: standalone export failed', err);
    showToast('Export failed: use dist/throbber-studio.html or serve the studio over http');
    return;
  }

  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'crystal-throbber.html';
  link.click();
  // Revoking in the same tick can cancel the download in some browsers
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Downloaded crystal-throbber.html');
}

document.getElementById('export-html-btn').addEventListener('click', downloadStandaloneHtml);
