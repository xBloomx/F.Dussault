// ── zoom.js — Zoom qualité Apple PWA (Pointer Events + GPU + Elastic) ─────────
// Sources: translate3d GPU, will-change, cubic-bezier elastic bounce
export function createZoomController({
    container, scrollArea, zoomDisplay,
    minZoom = 0.3, maxZoom = 3.0, step = 0.1, docWidthPx = 816
}) {
    let current = 1.0
    let _cleanupFns = []
    const area = scrollArea || container.parentElement

    // État zoom + pan
    let scale     = current
    let pointX    = 0
    let pointY    = 0
    let startX    = 0
    let startY    = 0
    let isPanning = false
    let prevDiff  = -1
    let evCache   = []

    // ── GPU : forcer translate3d + will-change ────────────────────────────────
    container.style.willChange      = 'transform'
    container.style.transformOrigin = '0 0'
    container.style.transform       = 'translate3d(0px, 0px, 0px) scale(1)'

    function _clamp(z) { return Math.max(minZoom, Math.min(maxZoom, z)) }

    function _updateTransform(animate = false) {
        if (animate) {
            // Effet élastique Apple : cubic-bezier(0.25, 1, 0.5, 1)
            container.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)'
        } else {
            container.style.transition = 'none'
        }
        container.style.transform = `translate3d(${pointX}px, ${pointY}px, 0px) scale(${scale})`
        if (zoomDisplay) zoomDisplay.textContent = Math.round(scale * 100) + '%'
        current = scale
    }

    // ── Centrage initial ──────────────────────────────────────────────────────
    function _centerDoc() {
        if (!area) return
        const areaW   = area.clientWidth
        const scaledW = docWidthPx * scale
        // Centrer horizontalement
        pointX = scaledW < areaW ? (areaW - scaledW) / 2 : Math.max(0, (areaW - scaledW) / 2)
        // Toujours partir du haut
        pointY = 15
    }

    // ── Pointer Events (tactile + souris unifié) ──────────────────────────────
    function onPointerDown(e) {
        evCache.push(e)
        container.setPointerCapture(e.pointerId)
        if (evCache.length === 1) {
            isPanning = true
            startX = e.clientX - pointX
            startY = e.clientY - pointY
            container.style.transition = 'none'
        }
    }

    function onPointerMove(e) {
        const idx = evCache.findIndex(ev => ev.pointerId === e.pointerId)
        if (idx === -1) return
        evCache[idx] = e

        if (evCache.length === 2) {
            // ── ZOOM PINCH ────────────────────────────────────────────────────
            isPanning = false
            container.style.transition = 'none'

            const curDiff = Math.hypot(
                evCache[0].clientX - evCache[1].clientX,
                evCache[0].clientY - evCache[1].clientY
            )

            if (prevDiff > 0) {
                // Point milieu entre les deux doigts
                const midX = (evCache[0].clientX + evCache[1].clientX) / 2
                const midY = (evCache[0].clientY + evCache[1].clientY) / 2
                const rect = area.getBoundingClientRect()
                const ox   = midX - rect.left
                const oy   = midY - rect.top

                // Point dans le doc avant zoom
                const docX = (ox - pointX) / scale
                const docY = (oy - pointY) / scale

                const delta = (curDiff - prevDiff) * 0.012
                scale = _clamp(scale + delta * scale)

                // Repositionner pour garder le point sous les doigts
                pointX = ox - docX * scale
                pointY = oy - docY * scale

                _updateTransform()
            }
            prevDiff = curDiff

        } else if (evCache.length === 1 && isPanning) {
            // ── PAN ───────────────────────────────────────────────────────────
            pointX = e.clientX - startX
            pointY = e.clientY - startY
            _updateTransform()
        }
    }

    function onPointerUp(e) {
        evCache = evCache.filter(ev => ev.pointerId !== e.pointerId)
        try { container.releasePointerCapture(e.pointerId) } catch {}

        if (evCache.length < 2) prevDiff = -1
        if (evCache.length === 0) {
            isPanning = false

            // ── Effet rebond élastique Apple ──────────────────────────────────
            let changed = false

            // Snap si zoom trop petit
            if (scale < minZoom + 0.05) {
                scale = minZoom; changed = true
            }
            // Snap si zoom trop grand
            if (scale > maxZoom - 0.05) {
                scale = maxZoom; changed = true
            }

            // Recentrer si le doc est plus petit que la zone
            if (area) {
                const areaW   = area.clientWidth
                const areaH   = area.clientHeight
                const scaledW = docWidthPx * scale
                const scaledH = container.offsetHeight * scale

                if (scaledW < areaW) { pointX = (areaW - scaledW) / 2; changed = true }
                else {
                    if (pointX > 0) { pointX = 0; changed = true }
                    if (pointX < areaW - scaledW) { pointX = areaW - scaledW; changed = true }
                }
                if (pointY > 0) { pointY = 0; changed = true }
            }

            _updateTransform(changed) // animate = true → cubic-bezier élastique
        }
    }

    // ── Ctrl+Molette desktop ──────────────────────────────────────────────────
    function onWheel(e) {
        if (!e.ctrlKey && !e.metaKey) return
        e.preventDefault()
        const rect = area.getBoundingClientRect()
        const ox   = e.clientX - rect.left
        const oy   = e.clientY - rect.top
        const docX = (ox - pointX) / scale
        const docY = (oy - pointY) / scale

        scale  = _clamp(scale + (e.deltaY < 0 ? step : -step) * scale)
        pointX = ox - docX * scale
        pointY = oy - docY * scale
        _updateTransform()
        current = scale
        if (zoomDisplay) zoomDisplay.textContent = Math.round(scale * 100) + '%'
    }

    function onKeyDown(e) {
        if (!e.ctrlKey && !e.metaKey) return
        if (e.key === '=' || e.key === '+') { e.preventDefault(); applyZoom(scale + step) }
        else if (e.key === '-')             { e.preventDefault(); applyZoom(scale - step) }
        else if (e.key === '0')             { e.preventDefault(); fitToScreen() }
    }

    // ── API publique ──────────────────────────────────────────────────────────
    function applyZoom(z) {
        scale = _clamp(z)
        _centerDoc()
        _updateTransform(true)
        current = scale
    }

    function fitToScreen() {
        if (!area) return
        const w = area.clientWidth
        if (w === 0) { requestAnimationFrame(fitToScreen); return }
        scale = w < docWidthPx + 60 ? (w - 20) / docWidthPx : 1.0
        scale = _clamp(scale)
        _centerDoc()
        _updateTransform(true)
        current = scale
        if (zoomDisplay) zoomDisplay.textContent = Math.round(scale * 100) + '%'
    }

    function zoomIn()    { applyZoom(scale + step) }
    function zoomOut()   { applyZoom(scale - step) }
    function zoomReset() { fitToScreen() }

    function attach() {
        container.addEventListener('pointerdown',   onPointerDown, { passive: false })
        container.addEventListener('pointermove',   onPointerMove, { passive: false })
        container.addEventListener('pointerup',     onPointerUp )
        container.addEventListener('pointercancel', onPointerUp )
        area.addEventListener('wheel', onWheel, { passive: false })
        document.addEventListener('keydown', onKeyDown)
        window.addEventListener('resize', fitToScreen)

        _cleanupFns.push(
            () => container.removeEventListener('pointerdown',   onPointerDown),
            () => container.removeEventListener('pointermove',   onPointerMove),
            () => container.removeEventListener('pointerup',     onPointerUp),
            () => container.removeEventListener('pointercancel', onPointerUp),
            () => area.removeEventListener('wheel', onWheel),
            () => document.removeEventListener('keydown', onKeyDown),
            () => window.removeEventListener('resize', fitToScreen)
        )
    }

    function destroy() {
        _cleanupFns.forEach(fn => fn())
        _cleanupFns = []
    }

    return { applyZoom, fitToScreen, zoomIn, zoomOut, zoomReset, attach, destroy, get current() { return current } }
}