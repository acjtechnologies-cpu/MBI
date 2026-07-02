import os
FILE = r'src\components\Chrono\ChronoPage.jsx'
c = open(FILE, encoding='utf-8').read()

# 1. Import LiveView
OLD1 = "import { syncGist, setGistToken, getGistToken } from './gistSync';"
NEW1 = "import { syncGist, setGistToken, getGistToken } from './gistSync';\nimport LiveView from './LiveView';"
if OLD1 in c:
    c = c.replace(OLD1, NEW1, 1); print("OK import LiveView")

# 2. Switch vue live (avant if journal)
OLD2 = "  if (vue === 'journal') {"
NEW2 = "  if (vue === 'live') {\n    return <LiveView onBack={() => setVue('chrono')} />;\n  }\n  if (vue === 'journal') {"
if OLD2 in c:
    c = c.replace(OLD2, NEW2, 1); print("OK switch vue live")

# 3. Bouton LIVE dans le header (apres bouton JOURNAL)
OLD3 = "          {/* Bouton Journal */}\n          <button\n            onClick={() => setVue('journal')}\n            style={{ ...btnMini, width: 'auto', padding: '0 7px', fontSize: 9,\n              color: '#60a5fa', border: '0.5px solid #1a3a5a', marginLeft: 2 }}\n          >JOURNAL</button>"
NEW3 = "          {/* Bouton Journal */}\n          <button\n            onClick={() => setVue('journal')}\n            style={{ ...btnMini, width: 'auto', padding: '0 7px', fontSize: 9,\n              color: '#60a5fa', border: '0.5px solid #1a3a5a', marginLeft: 2 }}\n          >JOURNAL</button>\n          {/* Bouton Live */}\n          <button\n            onClick={() => setVue('live')}\n            style={{ ...btnMini, width: 'auto', padding: '0 7px', fontSize: 9,\n              color: '#1D9E75', border: '0.5px solid #1D9E7544', marginLeft: 2 }}\n          >● LIVE</button>"
if OLD3 in c:
    c = c.replace(OLD3, NEW3, 1); print("OK bouton LIVE")
else:
    print("NON TROUVE bouton journal")

open(FILE, 'w', encoding='utf-8').write(c)
print("Done")
