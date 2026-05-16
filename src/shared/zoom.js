// ── zoom.js — Zoom qualité Apple (pinch à la position des doigts) ────────────
export function createZoomController({
    container,
    scrollArea,
    zoomDisplay,
    minZoom = 0.3,
    maxZoom = 3.0,
    step = 0.1,
    docWidthPx = 816
}) {
    let current = 1.0
    let _cleanupFns = []

    // ── Clamp zoom value ─────────────────────────────────────────────────────
    function _clamp(z) {
        return Math.round(Math.max(minZoom, Math.min(maxZoom, z)) * 100) / 100
    }

    function _getArea() {
        return scrollArea || container.parentElement
    }

    // ── Layout centré (après boutons +/-, fit) ───────────────────────────────
    function _applyLayout() {
        const area = _getArea()
        if (!area) return

        const scaledW = docWidthPx * current
        const areaW   = area.clientWidth

        container.style.transformOrigin = 'top center'
        container.style.marginLeft = ''

        const docH = container.offsetHeight
        if (current < 1.0) {
            container.style.marginBottom = `${(docH * current - docH + 60)}px`
        } else if (current > 1.0) {
            container.style.marginBottom = `${current * 400}px`
        } else {
            container.style.marginBottom = '100px'
        }
    }

    // ── Zoom centré (boutons, clavier) ───────────────────────────────────────
    function applyZoom(z) {
        current = _clamp(z)
        container.style.transform = `scale(${current})`
        if (zoomDisplay) zoomDisplay.textContent = Math.round(current * 100) + '%'
        _applyLayout()
    }

    // ── Zoom à un point précis (pinch iOS / Ctrl+molette) ────────────────────
    function _applyZoomAt(newZ, originX, originY) {
        const area = _getArea()
        if (!area) { applyZoom(newZ); return }

        newZ = _clamp(newZ)

        // Point du document sous les doigts AVANT le zoom
        const docX = (area.scrollLeft + originX) / current
        const docY = (area.scrollTop  + originY) / current

        // Appliquer le zoom depuis top left pour contrôle précis du scroll
        current = newZ
        container.style.transformOrigin = 'top left'
        container.style.marginLeft = '0px'
        container.style.transform = `scale(${current})`
        if (zoomDisplay) zoomDisplay.textContent = Math.round(current * 100) + '%'

        // Margin bottom
        const docH = container.offsetHeight
        if (current < 1.0) {
            container.style.marginBottom = `${(docH * current - docH + 60)}px`
        } else if (current > 1.0) {
            container.style.marginBottom = `${current * 400}px`
        } else {
            container.style.marginBottom = '100px'
        }

        // Repositionner scroll pour garder le point sous les doigts
        area.scrollLeft = docX * current - originX
        area.scrollTop  = docY * current - originY
    }

    // ── Quand le pinch se termine → recentrer proprement ────────────────────
    function _recenterAfterPinch() {
        const area = _getArea()
        if (!area) return

        // Sauvegarder position scroll relative
        const scrollCenterX = area.scrollLeft + area.clientWidth / 2
        const scrollCenterY = area.scrollTop  + area.clientHeight / 2
        const docCenterX    = scrollCenterX / current
        const docCenterY    = scrollCenterY / current

        // Revenir à top center
        container.style.transformOrigin = 'top center'
        container.style.marginLeft = ''

        const scaledW = docWidthPx * current
        const areaW   = area.clientWidth
        const offsetX = scaledW < areaW ? (areaW - scaledW) / 2 : 0

        // Recalculer scroll avec top center (le doc est décalé de offsetX)
        area.scrollLeft = docCenterX * current + offsetX - area.clientWidth / 2
        area.scrollTop  = docCenterY * current - area.clientHeight / 2
    }

    // ── Fit to screen ────────────────────────────────────────────────────────
    function fitToScreen() {
        const area = _getArea()
        if (!area) return
        const w = area.clientWidth
        if (w === 0) { requestAnimationFrame(fitToScreen); return }
        const padding = 30
        const targetZoom = w < (docWidthPx + padding * 2)
            ? Math.round(((w - padding * 2) / docWidthPx) * 100) / 100
            : 1.0
        applyZoom(targetZoom)
    }

    function zoomIn()    { applyZoom(current + step) }
    function zoomOut()   { applyZoom(current - step) }
    function zoomReset() { fitToScreen() }

    // ── Ctrl+Molette ─────────────────────────────────────────────────────────
    function onWheel(e) {
        if (!e.ctrlKey && !e.metaKey) return
        e.preventDefault()
        e.stopPropagation()
        const area = _getArea()
        const rect  = area.getBoundingClientRect()
        _applyZoomAt(current + (e.deltaY < 0 ? step : -step), e.clientX - rect.left, e.clientY - rect.top)
    }

    // ── Ctrl+Clavier ─────────────────────────────────────────────────────────
    function onKeyDown(e) {
        if (!e.ctrlKey && !e.metaKey) return
        if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn() }
        else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut() }
        else if (e.key === '0') { e.preventDefault(); zoomReset() }
    }

    // ── Pinch-to-zoom iOS ────────────────────────────────────────────────────
    let _pinchStartDist = null
    let _pinchStartZoom = 1.0
    let _isPinching     = false

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
            _isPinching = true
        }
    }

    function onTouchMove(e) {
        if (e.touches.length !== 2 || _pinchStartDist === null) return
        e.preventDefault()
        const area    = _getArea()
        const rect    = area.getBoundingClientRect()
        const mid     = _mid(e)
        const originX = mid.x - rect.left
        const originY = mid.y - rect.top
        const newZ    = _pinchStartZoom * (_dist(e) / _pinchStartDist)
        _applyZoomAt(newZ, originX, originY)
    }

    function onTouchEnd(e) {
        if (e.touches.length < 2 && _isPinching) {
            _pinchStartDist = null
            _isPinching = false
            // Recentrer après le pinch (rétablit top center)
            _recenterAfterPinch()
        }
    }

    // ── Attacher les listeners ───────────────────────────────────────────────
    function attach() {
        const area = _getArea()

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

    function destroy() {
        _cleanupFns.forEach(fn => fn())
        _cleanupFns = []
    }

    return { applyZoom, fitToScreen, zoomIn, zoomOut, zoomReset, attach, destroy, get current() { return current } }
}