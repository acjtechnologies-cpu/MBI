// ── Gist Sync — F3F Pit MBI vNext ─────────────────────────────────────────
// Token stocké en localStorage sous 'mbi_gist_token'
// Gist ID stocké en localStorage sous 'mbi_gist_id'

const GIST_TOKEN_KEY = 'mbi_gist_token'
const GIST_ID_KEY    = 'mbi_gist_id'
const GIST_FILENAME  = 'f3f_chrono_session.json'

export function getGistToken() {
  return localStorage.getItem(GIST_TOKEN_KEY) || ''
}

export function setGistToken(token) {
  localStorage.setItem(GIST_TOKEN_KEY, token.trim())
}

export function getGistId() {
  return localStorage.getItem(GIST_ID_KEY) || ''
}

// ── Créer un nouveau Gist ──────────────────────────────────────────────────
async function createGist(token, content) {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'F3F Pit — Chrono Sessions',
      public: false,
      files: {
        [GIST_FILENAME]: { content }
      }
    })
  })
  if (!res.ok) throw new Error(`Gist create failed: ${res.status}`)
  const data = await res.json()
  localStorage.setItem(GIST_ID_KEY, data.id)
  return data.id
}

// ── Mettre à jour un Gist existant ─────────────────────────────────────────
async function updateGist(token, gistId, content) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: { content }
      }
    })
  })
  if (!res.ok) throw new Error(`Gist update failed: ${res.status}`)
  return await res.json()
}

// ── Sync principale ────────────────────────────────────────────────────────
// data = objet JS à sérialiser (session courante ou journal complet)
// Retourne { ok, gistId, url } ou { ok: false, error }
export async function syncGist(data) {
  const token = getGistToken()
  if (!token) return { ok: false, error: 'Token manquant' }

  const content = JSON.stringify(data, null, 2)
  let gistId = getGistId()

  try {
    if (gistId) {
      await updateGist(token, gistId, content)
    } else {
      gistId = await createGist(token, content)
    }
    return {
      ok: true,
      gistId,
      url: `https://gist.github.com/${gistId}`
    }
  } catch (e) {
    // Si le Gist n'existe plus (supprimé), on en recrée un
    if (e.message.includes('404') || e.message.includes('update failed')) {
      localStorage.removeItem(GIST_ID_KEY)
      try {
        gistId = await createGist(token, content)
        return { ok: true, gistId, url: `https://gist.github.com/${gistId}` }
      } catch (e2) {
        return { ok: false, error: e2.message }
      }
    }
    return { ok: false, error: e.message }
  }
}

// ── Lire le Gist (pour future sync bidirectionnelle) ───────────────────────
export async function readGist() {
  const token  = getGistToken()
  const gistId = getGistId()
  if (!token || !gistId) return { ok: false, error: 'Token ou Gist ID manquant' }

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { 'Authorization': `token ${token}` }
  })
  if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }

  const data = await res.json()
  const raw  = data.files?.[GIST_FILENAME]?.content
  if (!raw) return { ok: false, error: 'Fichier absent du Gist' }

  try {
    return { ok: true, data: JSON.parse(raw) }
  } catch {
    return { ok: false, error: 'JSON invalide' }
  }
}
