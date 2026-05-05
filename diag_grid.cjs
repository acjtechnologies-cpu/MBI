const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Config\\ModelManager.jsx';
const c = fs.readFileSync(file, 'utf8');
const idx = c.lastIndexOf('<div className="grid grid-cols-3 gap-3 text-sm">');
console.log('idx:', idx);
console.log('Contexte:', JSON.stringify(c.slice(idx, idx + 400)));
