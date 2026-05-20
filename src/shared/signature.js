// src/shared/signature.js
// Converti depuis assets/shared/signature.js — ES module
// Adapté SPA : suppression des postMessage vers window.parent (plus d'iframes)

let _modal = null
let _canvas = null
let _ctx = null
let _currentTargetImg = null
let _previousValue = null
let _isDrawing = false
let _lastPoint = null
let _hasDrawn = false

function injectStyles() {
    if (document.getElementById('signature-fd-styles')) return
    const style = document.createElement('style')
    style.id = 'signature-fd-styles'
    style.textContent = `
        #sig-fd-modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 9999; justify-content: center; align-items: center; flex-direction: column; padding: 20px; box-sizing: border-box; }
        #sig-fd-modal.show { display: flex; animation: sigFdFade 0.2s ease; }
        @keyframes sigFdFade { from { opacity: 0; } to { opacity: 1; } }
        #sig-fd-modal .sig-fd-title { color: #fcca46; font-size: 18px; font-weight: bold; margin-bottom: 12px; text-align: center; }
        #sig-fd-modal .sig-fd-canvas-wrap { width: 100%; max-width: 700px; background: white; border-radius: 8px; position: relative; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
        #sig-fd-canvas { width: 100%; height: 350px; touch-action: none; display: block; cursor: crosshair; border-radius: 8px; }
        #sig-fd-modal .sig-fd-hint { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #aaa; font-style: italic; font-size: 16px; pointer-events: none; user-select: none; transition: opacity 0.2s; }
        #sig-fd-modal .sig-fd-hint.hidden { opacity: 0; }
        #sig-fd-modal .sig-fd-actions { display: flex; gap: 10px; margin-top: 16px; width: 100%; max-width: 700px; flex-wrap: wrap; }
        #sig-fd-modal .sig-fd-btn { flex: 1; min-width: 100px; padding: 14px 20px; border-radius: 6px; border: none; font-weight: bold; font-size: 15px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: 0.15s; }
        #sig-fd-modal .sig-fd-btn:active { transform: scale(0.97); }
        #sig-fd-modal .sig-fd-btn-clear { background: #343a40; color: white; }
        #sig-fd-modal .sig-fd-btn-cancel { background: #ff4d4d; color: white; }
        #sig-fd-modal .sig-fd-btn-ok { background: #28a745; color: white; }
        #sig-fd-modal .sig-fd-btn-ok:disabled { background: #555; cursor: not-allowed; }
        @media (max-width: 768px) {
            #sig-fd-modal { padding: 10px; }
            #sig-fd-canvas { height: 60vh; min-height: 250px; }
            #sig-fd-modal .sig-fd-actions { flex-direction: column; }
            #sig-fd-modal .sig-fd-btn { width: 100%; padding: 16px; }
        }
        @media (max-width: 932px) and (orientation: landscape) {
            #sig-fd-modal { padding: 8px; gap: 8px; }
            #sig-fd-modal .sig-fd-title { font-size: 14px; margin-bottom: 4px; }
            #sig-fd-canvas { height: calc(100vh - 130px); min-height: 150px; max-height: 70vh; }
            #sig-fd-modal .sig-fd-actions { flex-direction: row; margin-top: 8px; flex-wrap: nowrap; }
            #sig-fd-modal .sig-fd-btn { padding: 10px 14px; font-size: 13px; min-width: 0; }
        }
        #sig-fd-rotate-hint { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 10000; color: white; text-align: center; flex-direction: column; justify-content: center; align-items: center; padding: 30px; box-sizing: border-box; }
        #sig-fd-rotate-hint.show { display: flex; }
        #sig-fd-rotate-hint .rotate-icon { width: 80px; height: 80px; margin-bottom: 25px; animation: sigFdRotate 1.8s ease-in-out infinite; color: #fcca46; }
        @keyframes sigFdRotate { 0%, 100% { transform: rotate(0deg); } 40%, 60% { transform: rotate(90deg); } }
        .sig-box.has-signature { position: relative; }
        .sig-box.has-signature::before { content: "✓ Signé"; position: absolute; top: 2px; right: 4px; color: #28a745; font-size: 11px; font-weight: bold; background: white; padding: 2px 6px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); z-index: 2; pointer-events: none; }
    `
    document.head.appendChild(style)
}

function createModal() {
    if (_modal) return
    injectStyles()

    _modal = document.createElement('div')
    _modal.id = 'sig-fd-modal'
    _modal.innerHTML = `
        <div class="sig-fd-title" id="sig-fd-title">Signez dans la zone ci-dessous</div>
        <div class="sig-fd-canvas-wrap">
            <canvas id="sig-fd-canvas"></canvas>
            <div class="sig-fd-hint" id="sig-fd-hint">Signez ici avec votre doigt ou la souris</div>
        </div>
        <div class="sig-fd-actions">
            <button class="sig-fd-btn sig-fd-btn-clear" data-action="clear">↺ Effacer</button>
            <button class="sig-fd-btn sig-fd-btn-cancel" data-action="cancel">Annuler</button>
            <button class="sig-fd-btn sig-fd-btn-ok" data-action="ok" disabled>✓ Valider</button>
        </div>
    `
    document.body.appendChild(_modal)

    const rotateHint = document.createElement('div')
    rotateHint.id = 'sig-fd-rotate-hint'
    rotateHint.innerHTML = `
        <svg class="rotate-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
        <h2>Tournez votre téléphone</h2>
        <p>Pour signer plus confortablement, mettez votre téléphone à l'horizontale.</p>
    `
    document.body.appendChild(rotateHint)

    _canvas = _modal.querySelector('#sig-fd-canvas')
    _ctx = _canvas.getContext('2d')

    _modal.addEventListener('click', e => {
        const action = e.target.closest('[data-action]')?.dataset.action
        if (action === 'clear') clearCanvas()
        else if (action === 'cancel') cancelSignature()
        else if (action === 'ok') saveSignature()
    })

    document.addEventListener('keydown', e => {
        if (_modal.classList.contains('show') && e.key === 'Escape') cancelSignature()
    })

    _canvas.addEventListener('mousedown', startDrawing)
    _canvas.addEventListener('mousemove', moveDrawing)
    window.addEventListener('mouseup', endDrawing)
    _canvas.addEventListener('mouseleave', endDrawing)
    _canvas.addEventListener('touchstart', startDrawing, { passive: false })
    _canvas.addEventListener('touchmove', moveDrawing, { passive: false })
    _canvas.addEventListener('touchend', endDrawing)
    _canvas.addEventListener('touchcancel', endDrawing)

    let _resizeTimer = null
    window.addEventListener('resize', () => {
        if (!_modal.classList.contains('show')) return
        if (_resizeTimer) clearTimeout(_resizeTimer)
        _resizeTimer = setTimeout(() => {
            const current = _hasDrawn ? _canvas.toDataURL() : null
            resizeCanvas()
            if (current) {
                const img = new Image()
                img.onload = () => _ctx.drawImage(img, 0, 0, _canvas.clientWidth, _canvas.clientHeight)
                img.src = current
            }
            updateRotationHint()
        }, 120)
    })

    window.addEventListener('orientationchange', () => {
        if (_modal.classList.contains('show')) setTimeout(updateRotationHint, 100)
    })
}

function updateRotationHint(forceShow = false) {
    const hint = document.getElementById('sig-fd-rotate-hint')
    if (!hint) return
    if (!forceShow && (!_modal || !_modal.classList.contains('show'))) { hint.classList.remove('show'); return }
    const isMobile = window.innerWidth < 900 || window.matchMedia('(pointer: coarse)').matches
    const isPortrait = window.innerHeight > window.innerWidth
    hint.classList.toggle('show', isMobile && isPortrait)
}

function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    _canvas.width = _canvas.clientWidth * ratio
    _canvas.height = _canvas.clientHeight * ratio
    _ctx.scale(ratio, ratio)
    _ctx.lineWidth = 2.5
    _ctx.lineCap = 'round'
    _ctx.lineJoin = 'round'
    _ctx.strokeStyle = '#000'
    _ctx.imageSmoothingEnabled = true
    _ctx.imageSmoothingQuality = 'high'
}

function clearCanvas() {
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height)
    _hasDrawn = false
    updateHint()
    updateOkButton()
}

function updateHint() {
    const hint = document.getElementById('sig-fd-hint')
    if (hint) hint.classList.toggle('hidden', _hasDrawn)
}

function updateOkButton() {
    const btn = _modal?.querySelector('[data-action="ok"]')
    if (btn) btn.disabled = !_hasDrawn
}

function getPos(e) {
    const rect = _canvas.getBoundingClientRect()
    if (e.touches?.[0]) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function startDrawing(e) {
    e.preventDefault()
    _isDrawing = true
    _lastPoint = getPos(e)
    _ctx.beginPath()
    _ctx.moveTo(_lastPoint.x, _lastPoint.y)
    _ctx.lineTo(_lastPoint.x + 0.1, _lastPoint.y)
    _ctx.stroke()
    if (e.type === 'touchstart' && navigator.vibrate) { try { navigator.vibrate(10) } catch (_) {} }
}

function moveDrawing(e) {
    if (!_isDrawing) return
    e.preventDefault()
    const p = getPos(e)
    const midX = (_lastPoint.x + p.x) / 2
    const midY = (_lastPoint.y + p.y) / 2
    _ctx.quadraticCurveTo(_lastPoint.x, _lastPoint.y, midX, midY)
    _ctx.stroke()
    _lastPoint = p
    _hasDrawn = true
    updateHint()
    updateOkButton()
}

function endDrawing() {
    if (!_isDrawing) return
    _isDrawing = false
    if (_lastPoint) { _ctx.lineTo(_lastPoint.x, _lastPoint.y); _ctx.stroke() }
    _ctx.beginPath()
}

function openFor(targetImg) {
    createModal()
    _currentTargetImg = targetImg
    _previousValue = targetImg.src && targetImg.src !== '' && !targetImg.src.endsWith('/') ? targetImg.src : null

    const title = document.getElementById('sig-fd-title')
    if (title) {
        const sigText = targetImg.parentElement?.querySelector('.sig-text')
        title.textContent = sigText?.textContent.trim() || 'Signez dans la zone ci-dessous'
    }

    _modal.classList.add('show')
    // Notifier index.html qu'on entre en mode signature plein écran
    window.dispatchEvent(new CustomEvent('signature_mode', { detail: { action: 'enter' } }))
    updateRotationHint(true)

    setTimeout(() => {
        resizeCanvas()
        if (_previousValue) {
            const img = new Image()
            img.onload = () => {
                _ctx.drawImage(img, 0, 0, _canvas.clientWidth, _canvas.clientHeight)
                _hasDrawn = true
                updateHint()
                updateOkButton()
            }
            img.src = _previousValue
        } else {
            clearCanvas()
        }
    }, 30)
}

function close() {
    _modal?.classList.remove('show')
    // Notifier index.html qu'on sort du mode signature plein écran
    window.dispatchEvent(new CustomEvent('signature_mode', { detail: { action: 'exit' } }))
    _currentTargetImg = null
    _previousValue = null
    _isDrawing = false
    _lastPoint = null
    _hasDrawn = false
    const hint = document.getElementById('sig-fd-rotate-hint')
    if (hint) hint.classList.remove('show')
}

function cancelSignature() { close() }

function saveSignature() {
    if (!_currentTargetImg || !_hasDrawn) return
    _currentTargetImg.src = _canvas.toDataURL('image/png')
    markAsSigned(_currentTargetImg)
    close()
}

function markAsSigned(img) {
    if (!img) return
    const hasSig = img.src && img.src !== '' && !img.src.endsWith('/')
    const box = img.closest('.sig-box')
    if (box) box.classList.toggle('has-signature', hasSig)
    img.classList.toggle('has-signature', hasSig)
}

export function refreshIndicators(container) {
    const root = container || document
    root.querySelectorAll('.display-sig').forEach(markAsSigned)
}

export function attach(targetImg) {
    if (!targetImg) return
    targetImg.onclick = e => {
        e.preventDefault()
        if (targetImg.style.pointerEvents === 'none') return
        openFor(targetImg)
    }
    markAsSigned(targetImg)
}

export function attachAll(container) {
    if (!container) return
    container.querySelectorAll('.display-sig').forEach(attach)
}

export function watchContainer(container) {
    if (!container || !window.MutationObserver) return
    const obs = new MutationObserver(mutations => {
        for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'src' && m.target.classList.contains('display-sig')) {
                markAsSigned(m.target)
            }
            if (m.type === 'childList') {
                m.addedNodes.forEach(n => {
                    if (n.nodeType !== 1) return
                    const sigs = n.classList?.contains('display-sig') ? [n] : (n.querySelectorAll?.('.display-sig') || [])
                    sigs.forEach(s => { attach(s); markAsSigned(s) })
                })
            }
        }
    })
    obs.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] })
}