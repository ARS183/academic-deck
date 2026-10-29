// Usage: node mkfonts.js <fonts.manifest.json> <out.css>
// Manifest: [{family, file, weight, style?}] — files relative to the manifest; .ttf, .otf, .woff2.
const fs = require('fs'), path = require('path');
const mf = process.argv[2], out = process.argv[3] || 'fonts.css.txt';
const list = JSON.parse(fs.readFileSync(mf, 'utf8'));
const dir = path.dirname(mf);
const KIND = { '.ttf': ['font/ttf', 'truetype'], '.otf': ['font/otf', 'opentype'], '.woff2': ['font/woff2', 'woff2'] };
let css = '';
for (const f of list) {
  const [mime, format] = KIND[path.extname(f.file).toLowerCase()] || KIND['.ttf'];
  const b = fs.readFileSync(path.join(dir, f.file)).toString('base64');
  css += `@font-face{font-family:'${f.family}';font-style:${f.style || 'normal'};font-weight:${f.weight};font-display:swap;src:url(data:${mime};base64,${b}) format('${format}');}\n`;
}
fs.writeFileSync(out, css);
console.log('wrote', out, css.length, 'bytes');
