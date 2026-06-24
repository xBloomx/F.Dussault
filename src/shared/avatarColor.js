// Palette unique partagée dans toute l'app — toujours la même couleur pour le même nom
const PALETTE = [
    '#ef4444', // Rouge
    '#f43f5e', // Corail
    '#f97316', // Orange
    '#eab308', // Jaune
    '#84cc16', // Lime
    '#22c55e', // Vert
    '#14b8a6', // Turquoise
    '#06b6d4', // Cyan
    '#3b82f6', // Bleu
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Rose
    '#b45309', // Brun
    '#6b7280', // Gris
    '#4b5563', // Gris foncé
]

export function avatarColor(name) {
    let h = 0
    for (const c of (name || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0
    return PALETTE[h % PALETTE.length]
}

export function avatarInitials(name) {
    const parts = (name || '?').trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return (parts[0]?.[0] || '?').toUpperCase()
}

export function makeAvatar(name, size = 28) {
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${avatarColor(name)};display:flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.38)}px;font-weight:700;color:#fff;flex-shrink:0;letter-spacing:-0.2px">${avatarInitials(name)}</div>`
}
