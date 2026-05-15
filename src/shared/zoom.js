// ── zoom.js — Zoom interne SPA (indépendant du navigateur) ──────────────────
// Utilisé par facture.js, soumissions.js, feuilleTemps.js
// Supporte: boutons +/-, Ctrl+Molette, Pinch mobile, Ctrl+=/-, Ctrl+0

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

    // ── Appliquer le zoom ────────────────────────────────────────────────────
    function applyZoom(z) {
        current = Math.round(Math.max(minZoom, Math.min(maxZoom, z)) * 100) / 100
        container.style.transformOrigin = 'top center'
        container.style.transform = `scale(${current})`

        if (zoomDisplay) zoomDisplay.textContent = Math.round(current * 100) + '%'

        const area = scrollArea || container.parentElement
        if (!area) return

        const scaledW = docWidthPx * current
        const areaW = area.clientWidth

        // Centrer horizontalement si le document est plus petit que la zone
        container.style.marginLeft = scaledW < areaW
            ? `${Math.max(0, (areaW - scaledW) / 2)}px`
            : '0px'

        // Ajuster le margin-bottom pour que le scrollArea ait la bonne hauteur
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
        if (w === 0) {
            requestAnimationFrame(fitToScreen)
            return
        }
        const padding = 30 // px de marge de chaque côté
        const targetZoom = w < (docWidthPx + padding * 2)
            ? Math.round(((w - padding * 2) / docWidthPx) * 100) / 100
            : 1.0
        applyZoom(targetZoom)
    }

    // ── Boutons +/- ──────────────────────────────────────────────────────────
    function zoomIn()  { applyZoom(current + step) }
    function zoomOut() { applyZoom(current - step) }
    function zoomReset() { fitToScreen() }

    // ── Ctrl+Molette ─────────────────────────────────────────────────────────
    function onWheel(e) {
        if (!e.ctrlKey && !e.metaKey) return
        e.preventDefault()
        e.stopPropagation()
        const delta = e.deltaY < 0 ? step : -step
        applyZoom(current + delta)
    }

    // ── Ctrl+Clavier ─────────────────────────────────────────────────────────
    function onKeyDown(e) {
        if (!e.ctrlKey && !e.metaKey) return
        if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn() }
        else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut() }
        else if (e.key === '0') { e.preventDefault(); zoomReset() }
    }

    // ── Pinch-to-zoom mobile ─────────────────────────────────────────────────
    let _pinchStartDist = null
    let _pinchStartZoom = 1.0

    function getTouchDist(e) {
        const t = e.touches
        if (t.length < 2) return null
        const dx = t[0].clientX - t[1].clientX
        const dy = t[0].clientY - t[1].clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    function onTouchStart(e) {
        if (e.touches.length === 2) {
            _pinchStartDist = getTouchDist(e)
            _pinchStartZoom = current
            e.preventDefault()
        }
    }

    function onTouchMove(e) {
        if (e.touches.length !== 2 || _pinchStartDist === null) return
        e.preventDefault()
        const dist = getTouchDist(e)
        if (!dist) return
        const ratio = dist / _pinchStartDist
        applyZoom(_pinchStartZoom * ratio)
    }

    function onTouchEnd(e) {
        if (e.touches.length < 2) {
            _pinchStartDist = null
        }
    }

    // ── Attacher les listeners ───────────────────────────────────────────────
    function attach() {
        const area = scrollArea || container.parentElement

        // Ctrl+Scroll sur la zone de scroll
        area.addEventListener('wheel', onWheel, { passive: false })
        _cleanupFns.push(() => area.removeEventListener('wheel', onWheel))

        // Ctrl+Clavier sur le document
        document.addEventListener('keydown', onKeyDown)
        _cleanupFns.push(() => document.removeEventListener('keydown', onKeyDown))

        // Pinch sur la zone de scroll
        area.addEventListener('touchstart', onTouchStart, { passive: false })
        area.addEventListener('touchmove', onTouchMove, { passive: false })
        area.addEventListener('touchend', onTouchEnd)
        _cleanupFns.push(() => {
            area.removeEventListener('touchstart', onTouchStart)
            area.removeEventListener('touchmove', onTouchMove)
            area.removeEventListener('touchend', onTouchEnd)
        })

        // Resize fenêtre -> refit
        const onResize = () => fitToScreen()
        window.addEventListener('resize', onResize)
        _cleanupFns.push(() => window.removeEventListener('resize', onResize))
    }

    // ── Nettoyage ────────────────────────────────────────────────────────────
    function destroy() {
        _cleanupFns.forEach(fn => fn())
        _cleanupFns = []
    }

    // ── API publique ─────────────────────────────────────────────────────────
    return { applyZoom, fitToScreen, zoomIn, zoomOut, zoomReset, attach, destroy, get current() { return current } }
}
