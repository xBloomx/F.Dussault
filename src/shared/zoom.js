// ── zoom.js — Zoom hybride : natif iOS + JS desktop ──────────────────────────
// Sur iOS : zoom natif via overflow scroll (qualité Apple)
// Sur desktop : Ctrl+molette, boutons +/-

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
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    function _clamp(z) {
        return Math.round(Math.max(minZoom, Math.min(maxZoom, z)) * 100) / 100
    }

    function _getArea() {
        return scrollArea || container.parentElement
    }

    // ── Centrage desktop ──────────────────────────────────────────────────────
    function _center() {
        const area = _getArea()
        if (!area) return
        container.style.transformOrigin = 'top center'
        container.style.marginLeft = ''
        const scaledW = docWidthPx * current
        const areaW   = area.clientWidth
        if (scaledW < areaW) {
            container.style.marginLeft = `${(areaW - scaledW) / 2}px`
            container.style.transformOrigin = 'top left'
        }
        const docH = container.offsetHeight
        container.style.marginBottom = current < 1.0
            ? `${docH * current - docH + 60}px`
            : current > 1.0 ? `${current * 400}px` : '100px'
    }

    // ── Zoom desktop centré ───────────────────────────────────────────────────
    function applyZoom(z) {
        current = _clamp(z)
        container.style.transform = `scale(${current})`
        if (zoomDisplay) zoomDisplay.textContent = Math.round(current * 100) + '%'
        _center()
    }

    // ── Fit to screen ─────────────────────────────────────────────────────────
    function fitToScreen() {
        const area = _getArea()
        if (!area) return
        const w = area.clientWidth
        if (w === 0) { requestAnimationFrame(fitToScreen); return }
        const padding = isIOS ? 10 : 30
        const targetZoom = w < (docWidthPx + padding * 2)
            ? Math.round(((w - padding * 2) / docWidthPx) * 100) / 100
            : 1.0
        applyZoom(targetZoom)

        if (isIOS) _setupIOSNativeZoom()
    }

    function zoomIn()    { applyZoom(current + step) }
    function zoomOut()   { applyZoom(current - step) }
    function zoomReset() { fitToScreen() }

    // ── iOS : zoom natif via meta viewport dynamique ──────────────────────────
    // On retire la restriction maximum-scale sur le container de la feuille
    // et on laisse iOS gérer le pinch nativement sur la scroll-area
    function _setupIOSNativeZoom() {
        const area = _getArea()
        if (!area) return

        // Retirer transform — laisser iOS scroller nativement
        container.style.transform = ''
        container.style.transformOrigin = ''
        container.style.marginLeft = ''
        container.style.marginBottom = ''
        container.style.width = `${docWidthPx}px`

        // Configurer le scroll area pour zoom natif iOS
        area.style.overflow = 'scroll'
        area.style.webkitOverflowScrolling = 'touch'

        // Permettre le zoom sur ce container en modifiant le viewport temporairement
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover'
        }

        // Mettre le container en taille réelle — iOS zoom nativement
        area.style.touchAction = 'pan-x pan-y pinch-zoom'
        container.style.touchAction = 'pan-x pan-y pinch-zoom'

        if (zoomDisplay) zoomDisplay.textContent = 'Zoom natif'
    }

    // ── Ctrl+Molette desktop ──────────────────────────────────────────────────
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

    function onWheel(e) {
        if (!e.ctrlKey && !e.metaKey) return
        e.preventDefault()
        e.stopPropagation()
        const area = _getArea()
        const rect = area.getBoundingClientRect()
        const ox = e.clientX - rect.left
        const oy = e.clientY - rect.top
        const newZ = _clamp(current + (e.deltaY < 0 ? step : -step))

        const scrollLeft = area.scrollLeft
        const scrollTop  = area.scrollTop
        const docX = (scrollLeft + ox) / current
        const docY = (scrollTop  + oy) / current

        current = newZ
        container.style.transformOrigin = 'top left'
        container.style.transform = `scale(${current})`
        container.style.marginLeft = '0px'
        if (zoomDisplay) zoomDisplay.textContent = Math.round(current * 100) + '%'

        const docH = container.offsetHeight
        container.style.marginBottom = current < 1.0
            ? `${docH * current - docH + 60}px`
            : current > 1.0 ? `${current * 400}px` : '100px'

        area.scrollLeft = docX * current - ox
        area.scrollTop  = docY * current - oy
    }

    function onKeyDown(e) {
        if (!e.ctrlKey && !e.metaKey) return
        if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn() }
        else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut() }
        else if (e.key === '0') { e.preventDefault(); zoomReset() }
    }

    // ── Pinch JS (fallback non-iOS) ───────────────────────────────────────────
    function onTouchStart(e) {
        if (isIOS) return // iOS gère nativement
        if (e.touches.length === 2) {
            e.preventDefault()
            _pinchStartDist = _dist(e)
            _pinchStartZoom = current
        }
    }

    function onTouchMove(e) {
        if (isIOS) return
        if (e.touches.length !== 2 || _pinchStartDist === null) return
        e.preventDefault()
        const area = _getArea()
        const rect = area.getBoundingClientRect()
        const mid  = _mid(e)
        const ox   = mid.x - rect.left
        const oy   = mid.y - rect.top
        const newZ = _clamp(_pinchStartZoom * (_dist(e) / _pinchStartDist))

        const scrollLeft = area.scrollLeft
        const scrollTop  = area.scrollTop
        const docX = (scrollLeft + ox) / current
        const docY = (scrollTop  + oy) / current

        current = newZ
        container.style.transformOrigin = 'top left'
        container.style.transform = `scale(${current})`
        container.style.marginLeft = '0px'
        if (zoomDisplay) zoomDisplay.textContent = Math.round(current * 100) + '%'

        const docH = container.offsetHeight
        container.style.marginBottom = current < 1.0
            ? `${docH * current - docH + 60}px`
            : current > 1.0 ? `${current * 400}px` : '100px'

        area.scrollLeft = docX * current - ox
        area.scrollTop  = docY * current - oy
    }

    function onTouchEnd(e) {
        if (isIOS) return
        if (e.touches.length < 2) _pinchStartDist = null
    }

    // ── Attach ────────────────────────────────────────────────────────────────
    function attach() {
        const area = _getArea()

        area.addEventListener('wheel',      onWheel,      { passive: false })
        document.addEventListener('keydown', onKeyDown)

        if (!isIOS) {
            area.addEventListener('touchstart', onTouchStart, { passive: false })
            area.addEventListener('touchmove',  onTouchMove,  { passive: false })
            area.addEventListener('touchend',   onTouchEnd,   { passive: false })
        }

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
        // Restaurer viewport normal
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        }
        _cleanupFns.forEach(fn => fn())
        _cleanupFns = []
    }

    return { applyZoom, fitToScreen, zoomIn, zoomOut, zoomReset, attach, destroy, get current() { return current } }
}