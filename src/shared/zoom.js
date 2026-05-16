// ── zoom.js — Zoom qualité Apple (pinch à la position des doigts) ────────────
// Utilisé par facture.js, soumissions.js, feuilleTemps.js
// Supporte: boutons +/-, Ctrl+Molette, Pinch mobile (zoom à position des doigts), Ctrl+=/-, Ctrl+0

export function createZoomController({
    container,        // conteneur du document (invoice-container, etc.)
    scrollArea,       // zone de scroll parente
    zoomDisplay,      // <span> affichant le pourcentage
    minZoom = 0.3,
    maxZoom = 3.0,
    step = 0.1,
    docWidthPx = 816  // largeur logique du document en px (8.5in @ 96dpi)
}) {
    let current = 1.0
    let _cleanupFns = []

    // ── Appliquer le zoom centré (boutons +/-, fit) ──────────────────────────
    function applyZoom(z) {
        current = Math.round(Math.max(minZoom, Math.min(maxZoom, z)) * 100) / 100
        container.style.transformOrigin = 'top center'
        container.style.transform = `scale(${current})`
        if (zoomDisplay) zoomDisplay.textContent = Math.round(current * 100) + '%'
        _updateLayout(true)
    }

    // ── Appliquer le zoom à un point précis (pinch iOS / Ctrl+Molette) ───────
    function applyZoomAt(newZ, originX, originY) {
        const area = scrollArea || container.parentElement
        if (!area) { applyZoom(newZ); return }

        newZ = Math.round(Math.max(minZoom, Math.min(maxZoom, newZ)) * 100) / 100

        // Coordonnées du point sous les doigts dans le document avant zoom
        const scrollLeft = area.scrollLeft
        const scrollTop  = area.scrollTop
        const docX = (scrollLeft + originX) / current
        const docY = (scrollTop  + originY) / current

        // Appliquer le nouveau zoom depuis top left pour contrôle précis
        current = newZ
        container.style.transformOrigin = 'top left'
        container.style.transform = `scale(${current})`
        if (zoomDisplay) zoomDisplay.textContent = Math.round(current * 100) + '%'

        _updateLayout(false)

        // Repositionner le scroll pour que le point reste sous les doigts
        area.scrollLeft = docX * current - originX
        area.scrollTop  = docY * current - originY
    }

    // ── Layout (marges et hauteur scrollable) ────────────────────────────────
    function _updateLayout(centered) {
        const area = scrollArea || container.parentElement
        if (!area) return

        if (centered) {
            const scaledW = docWidthPx * current
            const areaW   = area.clientWidth
            container.style.marginLeft = scaledW < areaW
                ? `${Math.max(0, (areaW - scaledW) / 2)}px`
                : '0px'
        }

        const docH = container.offsetHeight
        if (current < 1.0) {
            container.style.marginBottom = `${(docH * current - docH + 60)}px`
        } else if (current > 1.0) {
            container.style.marginBottom = `${current * 400}px`
        } else {
            container.style.marginBottom = '100px'
        }
    }

    // ── Fit to screen ────────────────────────────────────────────────────────
    function fitToScreen() {
        const area = scrollArea || container.parentElement
        if (!area) return
        const w = area.clientWidth
        if (w === 0) { requestAnimationFrame(fitToScreen); return }
        const padding = 30
        const targetZoom = w < (docWidthPx + padding * 2)
            ? Math.round(((w - padding * 2) / docWidthPx) * 100) / 100
            : 1.0
        applyZoom(targetZoom)
    }

    // ── Boutons +/- ──────────────────────────────────────────────────────────
    function zoomIn()    { applyZoom(current + step) }
    function zoomOut()   { applyZoom(current - step) }
    function zoomReset() { fitToScreen() }

    // ── Ctrl+Molette ─────────────────────────────────────────────────────────
    function onWheel(e) {
        if (!e.ctrlKey && !e.metaKey) return
        e.preventDefault()
        e.stopPropagation()
        const area = scrollArea || container.parentElement
        const rect  = area.getBoundingClientRect()
        applyZoomAt(current + (e.deltaY < 0 ? step : -step), e.clientX - rect.left, e.clientY - rect.top)
    }

    // ── Ctrl+Clavier ─────────────────────────────────────────────────────────
    function onKeyDown(e) {
        if (!e.ctrlKey && !e.metaKey) return
        if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn() }
        else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut() }
        else if (e.key === '0') { e.preventDefault(); zoomReset() }
    }

    // ── Pinch-to-zoom iOS — zoom exactement à la position des doigts ─────────
    let _pinchStartDist = null
    let _pinchStartZoom = 1.0

    function _dist(e) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    function _mid(e) {
        return {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        }
    }

    function onTouchStart(e) {
        if (e.touches.length === 2) {
            e.preventDefault()
            _pinchStartDist = _dist(e)
            _pinchStartZoom = current
        }
    }

    function onTouchMove(e) {
        if (e.touches.length !== 2 || _pinchStartDist === null) return
        e.preventDefault()

        const area   = scrollArea || container.parentElement
        const rect   = area.getBoundingClientRect()
        const mid    = _mid(e)
        const originX = mid.x - rect.left
        const originY = mid.y - rect.top
        const newZ    = _pinchStartZoom * (_dist(e) / _pinchStartDist)

        applyZoomAt(newZ, originX, originY)
    }

    function onTouchEnd(e) {
        if (e.touches.length < 2) _pinchStartDist = null
    }

    // ── Attacher les listeners ───────────────────────────────────────────────
    function attach() {
        const area = scrollArea || container.parentElement

        area.addEventListener('wheel',      onWheel,      { passive: false })
        document.addEventListener('keydown', onKeyDown)
        area.addEventListener('touchstart', onTouchStart, { passive: false })
        area.addEventListener('touchmove',  onTouchMove,  { passive: false })
        area.addEventListener('touchend',   onTouchEnd,   { passive: false })

        const onResize = () => fitToScreen()
        window.addEventListener('resize', onResize)

        _cleanupFns.push(
            () => area.removeEventListener('wheel', onWheel),
            () => document.removeEventListener('keydown', onKeyDown),
            () => area.removeEventListener('touchstart', onTouchStart),
            () => area.removeEventListener('touchmove',  onTouchMove),
            () => area.removeEventListener('touchend',   onTouchEnd),
            () => window.removeEventListener('resize',   onResize)
        )
    }

    // ── Nettoyage ────────────────────────────────────────────────────────────
    function destroy() {
        _cleanupFns.forEach(fn => fn())
        _cleanupFns = []
    }

    return { applyZoom, fitToScreen, zoomIn, zoomOut, zoomReset, attach, destroy, get current() { return current } }
}