// Builds dist/throbber-studio.html: index.html with its local CSS and scripts inlined.
// Run with `npm run build`. CDN libraries stay as <script> tags, so the page still needs
// an internet connection, but it no longer needs a web server and exports work from disk.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// A literal closing tag inside inlined code would end the element early
const escapeEnd = (source, tag) => source.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);

function buildSingleFile(html) {
  const withStyles = html.replace(
    /<link rel="stylesheet" href="(css\/[^"]+)">/g,
    (_, file) => `<style data-src="${file}">\n${escapeEnd(read(file), 'style')}</style>`
  );
  // data-src lets the standalone export read an inlined script's source back from the page
  return withStyles.replace(
    /<script src="(js\/[^"]+)"><\/script>/g,
    (_, file) => `<script data-src="${file}">\n${escapeEnd(read(file), 'script')}</script>`
  );
}

function render() {
  const output = buildSingleFile(read('index.html'));
  const leftovers = output.match(/\s(?:src|href)="(?:js|css)\/[^"]*"/g);
  if (leftovers) throw new Error(`Local files were not inlined: ${leftovers.join(', ')}`);
  return output;
}

function build() {
  const output = render();
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(root, 'dist', 'throbber-studio.html'), output);
  return output;
}

if (require.main === module) {
  const output = build();
  console.log(`Wrote dist/throbber-studio.html (${Math.round(output.length / 1024)} KB)`);
}

module.exports = { build, render };
