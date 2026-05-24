// src/shared/pdfExport.js
// Converti depuis assets/shared/pdf-export.js — ES module
// Utilise html2canvas et jsPDF via npm

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const PAGE_WIDTH_PX = 816
const PAGE_HEIGHT_PX = 1056

function safeName(s) {
    if (!s) return ''
    return String(s)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 40)
}

function buildFilename(opts) {
    const parts = []
    if (opts.docNumber) parts.push(safeName(opts.docNumber))
    else if (opts.docType) {
        const map = { facture: 'Facture', soumission: 'Soumission', feuille: 'Feuille' }
        parts.push(map[opts.docType] || 'Document')
    }
    if (opts.clientName) parts.push(safeName(opts.clientName))
    if (opts.date) parts.push(safeName(opts.date))
    if (parts.length === 0) parts.push('Document')
    return parts.join('_') + '.pdf'
}

async function generatePdfBlob(container) {
    const pages = container.querySelectorAll('.page')
    if (pages.length === 0) throw new Error('Aucune page à exporter.')

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter', compress: true })
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()
    const pageImages = []

    for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
            scale: window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio || 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            width: PAGE_WIDTH_PX,
            height: PAGE_HEIGHT_PX,
            windowWidth: PAGE_WIDTH_PX,
            windowHeight: PAGE_HEIGHT_PX,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
            onclone: (clonedDoc) => {
                clonedDoc.querySelectorAll('.page').forEach(p => {
                    p.style.transform = 'none'
                    p.style.boxShadow = 'none'
                    p.style.margin = '0'
                })
                clonedDoc.querySelectorAll('#invoice-container, #quote-container, #zoom-wrapper').forEach(c => {
                    c.style.transform = 'none'
                    c.style.marginLeft = '0'
                    c.style.marginBottom = '0'
                })

                // Enlever TOUT le bleu — cibler toutes les classes avec var(--blue-bg)
                clonedDoc.querySelectorAll(
                    '.field input, .field, td, .input-box, .input-box input, ' +
                    '.display-sig, .red-invoice-input, .red-quote-input, ' +
                    '.ts-field input, .ts-field, .sig-area'
                ).forEach(el => {
                    el.style.setProperty('background', 'white', 'important')
                    el.style.setProperty('background-color', 'white', 'important')
                })

                // Inputs/textarea transparents par-dessus le fond blanc
                clonedDoc.querySelectorAll('input, textarea, select').forEach(f => {
                    f.style.setProperty('background', 'transparent', 'important')
                    f.style.setProperty('background-color', 'transparent', 'important')
                    f.style.color = '#000'
                    f.style.boxShadow = 'none'
                    if (!f.value && f.placeholder) f.placeholder = ''
                })

                clonedDoc.querySelectorAll('.h-suffix').forEach(span => {
                    const inp = span.closest('td')?.querySelector('input')
                    if (inp && !inp.value) span.style.display = 'none'
                })
            }
        })
        const imgData = canvas.toDataURL('image/jpeg', 0.92)
        pageImages.push(imgData)
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST')
    }

    return { blob: pdf.output('blob'), pageImages }
}

function injectModalStyles() {
    if (document.getElementById('pdf-export-fd-styles')) return
    const style = document.createElement('style')
    style.id = 'pdf-export-fd-styles'
    style.textContent = `
        .pdfx-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 99998; display: flex; flex-direction: column; }
        .pdfx-header { background: var(--bg-panel, #2b2c36); color: #e0e0e0; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; }
        .pdfx-title { font-size: 16px; font-weight: bold; }
        .pdfx-close { background: transparent; border: none; color: #e0e0e0; font-size: 24px; cursor: pointer; padding: 0 8px; line-height: 1; }
        .pdfx-close:hover { color: #ff4d4d; }
        .pdfx-body { flex: 1; background: #525659; display: flex; align-items: flex-start; justify-content: center; overflow: auto; padding: 20px; }
        .pdfx-pages { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; max-width: 900px; }
        .pdfx-page { display: block; width: 100%; height: auto; background: white; box-shadow: 0 4px 16px rgba(0,0,0,0.5); }
        .pdfx-loading { color: white; font-size: 18px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .pdfx-spinner { width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.2); border-top-color: #fcca46; border-radius: 50%; animation: pdfxSpin 0.8s linear infinite; }
        @keyframes pdfxSpin { to { transform: rotate(360deg); } }
        .pdfx-footer { background: var(--bg-panel, #2b2c36); color: #e0e0e0; padding: 14px 20px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #444; flex-wrap: wrap; }
        .pdfx-btn { padding: 10px 20px; border-radius: 6px; border: none; font-weight: bold; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .pdfx-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pdfx-btn-secondary { background: #343a40; color: white; }
        .pdfx-btn-primary { background: #fcca46; color: black; }
        .pdfx-error { color: #ffb3b3; font-size: 15px; padding: 20px; text-align: center; }
        @media (max-width: 600px) { .pdfx-footer { flex-direction: column-reverse; } .pdfx-btn { width: 100%; justify-content: center; } }
    `
    document.head.appendChild(style)
}

function buildModal(filename) {
    injectModalStyles()
    const overlay = document.createElement('div')
    overlay.className = 'pdfx-overlay'
    overlay.innerHTML = `
        <div class="pdfx-header">
            <span class="pdfx-title">Aperçu PDF</span>
            <button class="pdfx-close" data-action="close">×</button>
        </div>
        <div class="pdfx-body">
            <div class="pdfx-loading">
                <div class="pdfx-spinner"></div>
                <div>Génération du PDF en cours…</div>
            </div>
        </div>
        <div class="pdfx-footer">
            <button class="pdfx-btn pdfx-btn-secondary" data-action="close">Fermer</button>
            <button class="pdfx-btn pdfx-btn-primary" data-action="download" disabled>
                ⬇ Télécharger ${filename ? '(' + filename + ')' : ''}
            </button>
        </div>
    `
    document.body.appendChild(overlay)

    const escHandler = e => { if (e.key === 'Escape') close() }

    function close() {
        document.removeEventListener('keydown', escHandler)
        if (overlay._blobUrl) { URL.revokeObjectURL(overlay._blobUrl); overlay._blobUrl = null }
        overlay.remove()
    }

    overlay.addEventListener('click', e => {
        const action = e.target.closest('[data-action]')?.dataset.action
        if (action === 'close') close()
    })

    document.addEventListener('keydown', escHandler)

    return {
        overlay,
        setError(msg) {
            const body = overlay.querySelector('.pdfx-body')
            const el = document.createElement('div')
            el.className = 'pdfx-error'
            el.textContent = '⚠ ' + msg
            body.replaceChildren(el)
        },
        setPdfBlob(blob, pageImages, downloadFilename) {
            const url = URL.createObjectURL(blob)
            overlay.querySelector('.pdfx-body').innerHTML =
                `<div class="pdfx-pages">${pageImages.map((src, i) => `<img class="pdfx-page" src="${src}" alt="Page ${i + 1}">`).join('')}</div>`
            const dlBtn = overlay.querySelector('[data-action="download"]')
            dlBtn.disabled = false
            dlBtn.onclick = () => {
                const a = document.createElement('a')
                a.href = url; a.download = downloadFilename
                document.body.appendChild(a); a.click(); a.remove()
            }
            overlay._blobUrl = url
        },
        close
    }
}

export async function openPdfPreview(opts) {
    if (!opts?.container) { console.error('[pdfExport] opts.container requis'); return }
    const filename = buildFilename(opts)
    const modal = buildModal(filename)
    try {
        const { blob, pageImages } = await generatePdfBlob(opts.container)
        modal.setPdfBlob(blob, pageImages, filename)
    } catch (e) {
        console.error('[pdfExport] Erreur:', e)
        modal.setError('Impossible de générer le PDF. ' + (e?.message || ''))
    }
}