// Writes a Brotli (.br) and a gzip (.gz) copy next to every text file in the website build, at the
// strongest settings. Caddy sends these to browsers that accept them (deploy/Caddyfile).
// Usage: node precompress.js <build folder>
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const TEXT = /\.(js|css|html|json|svg|txt|ico|map)$/;
let saved = 0;
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (TEXT.test(entry.name) && fs.statSync(file).size > 1024) {
      const raw = fs.readFileSync(file);
      const br = zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } });
      fs.writeFileSync(`${file}.br`, br);
      fs.writeFileSync(`${file}.gz`, zlib.gzipSync(raw, { level: 9 }));
      saved += raw.length - br.length;
    }
  }
};
walk(process.argv[2]);
console.log(`precompressed; Brotli saves ${(saved / 1024).toFixed(0)} KB`);
