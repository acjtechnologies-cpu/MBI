const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
const c = fs.readFileSync(file, 'utf8');
const idx = c.lastIndexOf('cgAff');
const start = c.lastIndexOf('<div style={{textAlign', idx);
const end = c.indexOf('</div>\n          </div>\n          <div style={{display', start);
const end2 = c.indexOf("</div>\r\n          </div>\r\n          <div style={{display", start);
console.log('start:', start, 'end:', end, 'end2:', end2);
console.log(JSON.stringify(c.slice(start, (end2 !== -1 ? end2 : end) + 6)));
