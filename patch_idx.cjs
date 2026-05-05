const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Poly4\\Poly4Page.jsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace('datasets[2].data = chartData.adaptive', 'datasets[1].data = chartData.adaptive');
c = c.replace('datasets[3].data = chartData.dense',    'datasets[2].data = chartData.dense');
c = c.replace('datasets[4].data = chartData.leger',    'datasets[3].data = chartData.leger');
c = c.replace('datasets[5].data = [{ x: vent, y: chartData.massePt }]', 'datasets[4].data = [{ x: vent, y: chartData.massePt }]');
c = c.replace('datasets[6].data = [{ x: vent, y: 2.0 }, { x: vent, y: 5.0 }]', 'datasets[5].data = [{ x: vent, y: 2.0 }, { x: vent, y: 5.0 }]');

fs.writeFileSync(file, c, 'utf8');
console.log('OK - index datasets corriges');
