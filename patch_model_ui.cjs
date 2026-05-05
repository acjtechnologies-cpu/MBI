const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Config\\ModelManager.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. formData initial
c = c.replace(
  'surface: model?.surface || 59 })',
  'surface: model?.surface || 59, masse_ref_8ms: model?.masse_ref_8ms || 3.474 })'
);

// 2. champ input - cherche apres le champ surface
const surfaceEnd = c.indexOf("Surface alaire");
const divEnd = c.indexOf('</div>', c.indexOf('</div>', surfaceEnd) + 1) + 6;
const newField = `
            <div class="col-span-2" style={{gridColumn:'span 2'}}>
              <label style={{fontSize:11,color:'#9ca3af',display:'block',marginBottom:4}}>Masse ref 8 m/s (kg) — ADN planeur</label>
              <input type="number" step="0.001" value={formData.masse_ref_8ms} onChange={(e) => setFormData({...formData, masse_ref_8ms: parseFloat(e.target.value) || 3.474})} style={{width:'100%',background:'#111827',border:'1px solid #16a34a',borderRadius:6,padding:'8px 12px',color:'#4ade80',fontWeight:700}} />
              <div style={{fontSize:10,color:'#6b7280',marginTop:3}}>Offset vs Pike : {Math.round((formData.masse_ref_8ms - 3.474) * 1000)}g</div>
            </div>`;

c = c.slice(0, divEnd) + newField + c.slice(divEnd);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
