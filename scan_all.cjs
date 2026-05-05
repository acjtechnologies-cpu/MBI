const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src';
const patterns = [/\u00c3/g, /\u00c2/g, /\u00ce/g, /\u00cf/g, /\u00f0\u009f/g, /\u00e2/g, /\u0192/g];

function scanDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) return scanDir(full);
    if (!f.endsWith('.jsx') && !f.endsWith('.js')) return;
    const c = fs.readFileSync(full, 'utf8');
    const lines = c.split('\n');
    let found = false;
    lines.forEach((l, i) => {
      if (patterns.some(p => p.test(l))) {
        if (!found) { console.log('\n=== ' + full.replace('C:\\Users\\Public\\Documents\\mbi-vnext\\src\\', '')); found = true; }
        console.log(i + ': ' + JSON.stringify(l.trim().slice(0, 100)));
      }
      patterns.forEach(p => p.lastIndex = 0);
    });
  });
}
scanDir(srcDir);
console.log('\nSCAN TERMINE');
