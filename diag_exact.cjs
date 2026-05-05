const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Config\\ModelManager.jsx';
const c = fs.readFileSync(file, 'utf8');
const lines = c.split('\n');
[19, 49, 58, 76, 97, 105, 150, 188, 231].forEach(i => {
  const l = lines[i] || '';
  // Trouve les sequences corrompues
  for (let j = 0; j < l.length; j++) {
    if (l.charCodeAt(j) > 127) {
      let seq = '';
      let k = j;
      while (k < l.length && l.charCodeAt(k) > 127) {
        seq += '\\u' + l.charCodeAt(k).toString(16).padStart(4,'0');
        k++;
      }
      console.log('L'+i+' pos'+j+':', seq, '->', JSON.stringify(l.slice(j,k)));
      j = k - 1;
    }
  }
});
