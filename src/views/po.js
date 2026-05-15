// src/views/po.js
// Migré fidèlement depuis code_po/code_po.html

import { supabase } from '../supabase.js'
import { currentUser, currentRole, currentProfil, hasPermission } from '../auth.js'

// ── État local ──────────────────────────────────────────────────────────────
let myUserName = 'Employé'
let currentPoTab = 'mine'
let poLog = []
let poPage = 0
const PO_PAGE_SIZE = 25
let poHasMore = false
let itemToProcessId = null
let confirmCallback = null

// ── Render principal ────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        .po-main { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .action-btn { background-color: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
        .action-btn:hover { background-color: var(--accent-hover); transform: translateY(-2px); }
        .action-btn svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .toolbar { display: flex; gap: 15px; align-items: center; background-color: var(--bg-panel); padding: 15px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);}
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: #1e1f26; border: 1px solid #444; color: white; padding: 14px 15px 14px 45px; border-radius: 8px; font-size: 16px; outline: none; transition: 0.2s; }
        .search-box input:focus { border-color: var(--accent); }
        .search-icon { position: absolute; left: 15px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .tabs-container { display: flex; gap: 10px; }
        .btn-tab { background: #1a1b23; color: #aaa; border: 1px solid #444; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-tab svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-tab.active { background: var(--btn-blue); color: white; border-color: var(--btn-blue); }
        .section-title { font-size: 16px; color: var(--accent); text-transform: uppercase; margin-top: 10px; margin-bottom: 5px; border-bottom: 1px solid #444; padding-bottom: 5px; }
        .po-list { display: flex; flex-direction: column; gap: 15px; padding-bottom: 30px; }
        .po-item { background-color: var(--bg-panel); padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid var(--btn-green); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .po-info { display: flex; flex-direction: column; gap: 5px; flex: 1; }
        .po-number { font-size: 20px; font-weight: bold; color: var(--accent); font-family: monospace; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; }
        .po-details { color: white; font-size: 15px; display: flex; align-items: center; gap: 15px; flex-wrap: wrap; margin-top: 5px; }
        .po-details span { display: flex; align-items: center; gap: 5px; }
        .po-details svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .po-subtext { color: #aaa; font-size: 13px; margin-top: 5px; display: flex; align-items: center; gap: 8px; }
        .po-subtext svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .po-actions { display: flex; gap: 10px; margin-left: 20px; flex-wrap: wrap; justify-content: flex-end; }
        .btn-copy { background: #444; color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; display: flex; gap: 6px; align-items: center; }
        .btn-copy svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-copy:hover { background: #555; }
        .btn-delete { background: rgba(255,77,77,0.1); color: var(--btn-red); border: 1px solid transparent; width: 40px; height: 40px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
        .btn-delete svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-delete:hover { background: var(--btn-red); color: white; }
        .status-badge { font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: bold; background: var(--btn-green); color: white; display: flex; align-items: center; gap: 4px; }
        .status-badge svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 2; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: none; z-index: 4000; justify-content: center; align-items: center; }
        .modal-overlay.open { display: flex; }
        .modal-card-basic { background: var(--bg-panel); width: 350px; padding: 25px; border-radius: 15px; text-align: center; border: 1px solid #555; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .modal-actions { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }
        .btn-modal-gray { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
        .btn-modal-yellow { background: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-modal-red { background: var(--btn-red); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }

        .custom-form-card { background: #252631; width: 90%; max-width: 450px; padding: 30px; border-radius: 30px; box-shadow: 0 15px 35px rgba(0,0,0,0.5); position: relative; border: 1px solid #444; max-height: 90vh; overflow-y: auto; }
        .modal-header-custom { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; color: white; font-size: 24px; }
        .modal-header-custom svg { width: 35px; height: 35px; stroke: currentColor; fill: none; stroke-width: 2; }
        .custom-group { margin-bottom: 18px; text-align: left; }
        .custom-group label { display: block; color: white; margin-bottom: 7px; font-size: 14px; }
        .custom-group input, .custom-group select { width: 100%; padding: 12px 15px; background: #323443; border: 1px solid transparent; color: white; border-radius: 8px; font-size: 16px; outline: none; transition: 0.2s; box-sizing: border-box; }
        .custom-group input:focus, .custom-group select:focus { border-color: var(--accent); }
        .file-upload-btn { background: #1a1b23; border: 1px dashed #888; color: #ccc; padding: 12px; text-align: center; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; font-size: 14px; }
        .file-upload-btn svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .file-upload-btn:hover { border-color: var(--accent); color: white; }
        .btn-custom-submit { background-color: var(--accent); color: black; border: none; width: 100%; padding: 15px; border-radius: 12px; font-weight: bold; font-size: 18px; cursor: pointer; margin-top: 10px; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-custom-submit:hover { background-color: var(--accent-hover); }
        .btn-close-modal { position: absolute; top: 15px; right: 20px; background: none; border: none; color: #888; font-size: 30px; cursor: pointer; }
        .btn-close-modal:hover { color: white; }

        .po-result-box { background: #1a1b23; border-radius: 12px; padding: 20px; text-align: center; margin-top: 20px; border: 1px dashed var(--border); display: none; }
        .po-result-title { color: #aaa; font-size: 13px; margin-bottom: 5px; text-transform: uppercase; }
        .po-result-number { color: var(--accent); font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 1px; margin-bottom: 15px; }
        .btn-copy-large { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; gap: 8px; align-items: center; width: 100%; justify-content: center; margin-bottom: 10px; }
        .btn-copy-large svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-copy-large:hover { background: #555; }
        .btn-copy-large.success { background: var(--btn-green); color: white; }

        @media (max-width: 768px) {
            .po-main { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; width: 100%; }
            .dash-header .action-btn { width: 100%; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
            .tabs-container { flex-direction: column; width: 100%; }
            .btn-tab { width: 100%; justify-content: center; }
            .po-item { flex-direction: column; align-items: flex-start; gap: 15px; padding: 15px; }
            .po-actions { align-self: stretch; margin-left: 0; width: 100%; }
            .btn-copy { flex: 1; justify-content: center; }
        }
    </style>

    <div class="po-main">
        <div class="dash-header">
            <div class="dash-title">
                <h1>Demande de PO</h1>
                <p>Générateur de numéros uniques</p>
            </div>
            <button class="action-btn" id="btnNewPO">
                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Demander un numéro de PO
            </button>
        </div>

        <div class="tabs-container" id="poTabs" style="display:none">
            <button id="tab-mine" class="btn-tab active">
                <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Mes PO
            </button>
            <button id="tab-all" class="btn-tab">
                <svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01"/></svg>
                Tous les PO
            </button>
        </div>

        <div class="toolbar">
            <div class="search-box">
                <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                <input type="text" id="poSearch" placeholder="Rechercher (Numéro, Fournisseur, Adresse, Date...)">
            </div>
        </div>

        <div class="section-title">Liste des PO</div>
        <div class="po-list" id="poListContainer"></div>
    </div>

    <!-- Modal nouveau PO -->
    <div class="modal-overlay" id="poModal">
        <div class="custom-form-card">
            <button class="btn-close-modal" id="btnClosePoModal">×</button>
            <div class="modal-header-custom">
                <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Nouveau Bon de Commande
            </div>
            <div id="poFormZone">
                <div class="custom-group">
                    <label>Nom du plombier</label>
                    <input type="text" id="inpPlombier" placeholder="Ex: François">
                </div>
                <div class="custom-group">
                    <label>Fournisseur</label>
                    <select id="selFournisseur">
                        <option value="">-- Choisir un fournisseur --</option>
                    </select>
                    <input type="text" id="inpFournisseurAutre" placeholder="Nom du fournisseur" style="display:none;margin-top:8px">
                    <input type="hidden" id="inpFournisseur">
                </div>
                <div class="custom-group">
                    <label>Adresse / Lieu du chantier</label>
                    <input type="text" id="inpAdresse" placeholder="Adresse du chantier">
                </div>
                <div class="custom-group">
                    <label>Date</label>
                    <input type="text" id="inpDate" placeholder="JJ/MM/AAAA" inputmode="numeric" maxlength="10">
                </div>
                <div class="custom-group">
                    <label>Photo de la soumission / reçu (Optionnel)</label>
                    <label class="file-upload-btn" for="inpPhoto">
                        <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        <span id="labelPhotoText">Ajouter une photo...</span>
                    </label>
                    <input type="file" id="inpPhoto" accept="image/*" style="display:none">
                </div>
                <button class="btn-custom-submit" id="btnGeneratePO">Générer le numéro</button>
            </div>
            <div id="poResultZone" class="po-result-box">
                <div class="po-result-title">Numéro généré avec succès</div>
                <div class="po-result-number" id="displayNewPoNumber">PO-XXXXXX-XXXX</div>
                <button class="btn-copy-large" id="btnCopyMain">
                    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copier le numéro
                </button>
                <p style="font-size:12px;color:#aaa;margin-top:10px">Ce numéro est maintenant enregistré dans votre liste.</p>
            </div>
        </div>
    </div>

    <!-- Modal alerte -->
    <div class="modal-overlay" id="alertModal">
        <div class="modal-card-basic">
            <div style="font-size:20px;color:var(--accent);font-weight:bold;margin-bottom:15px">Information</div>
            <div style="color:#e0e0e0;margin-bottom:25px;line-height:1.4" id="alertMsg"></div>
            <div class="modal-actions"><button class="btn-modal-yellow" style="width:100%" id="btnCloseAlert">Compris</button></div>
        </div>
    </div>

    <!-- Modal confirmation -->
    <div class="modal-overlay" id="confirmModal">
        <div class="modal-card-basic">
            <div style="font-size:20px;color:var(--btn-red);font-weight:bold;margin-bottom:15px" id="confirmTitle">Action</div>
            <div style="color:#e0e0e0;margin-bottom:25px" id="confirmMsg">Êtes-vous sûr ?</div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCancelConfirm">Annuler</button>
                <button class="btn-modal-red" id="btnYesConfirm">Confirmer</button>
            </div>
        </div>
    </div>
    `

    await init()
}

// ── Init ────────────────────────────────────────────────────────────────────
async function init() {
    if (!currentUser) return
    myUserName = currentProfil?.prenom_nom || currentUser.email.split('@')[0]

    // Tabs
    if (hasPermission('view_all_po')) {
        document.getElementById('poTabs').style.display = 'flex'
    }
    document.getElementById('tab-mine').addEventListener('click', () => switchPoTab('mine'))
    document.getElementById('tab-all').addEventListener('click', () => switchPoTab('all'))

    // Recherche
    document.getElementById('poSearch').addEventListener('keyup', filterPO)

    // Modal PO
    document.getElementById('btnNewPO').addEventListener('click', openPoModal)
    document.getElementById('btnClosePoModal').addEventListener('click', () => closeModal('poModal'))
    document.getElementById('btnGeneratePO').addEventListener('click', generatePO)
    document.getElementById('selFournisseur').addEventListener('change', onFournisseurChange)
    document.getElementById('inpFournisseurAutre').addEventListener('input', e => {
        document.getElementById('inpFournisseur').value = e.target.value.trim()
    })
    document.getElementById('inpDate').addEventListener('keyup', e => autoFormatDatePO(e.target))
    document.getElementById('inpPhoto').addEventListener('change', updateFileLabel)
    document.getElementById('btnCopyMain').addEventListener('click', () => {
        copyTextToClipboard(
            document.getElementById('displayNewPoNumber').textContent,
            document.getElementById('btnCopyMain'),
            true
        )
    })

    // Modales
    document.getElementById('btnCloseAlert').addEventListener('click', () => closeModal('alertModal'))
    document.getElementById('btnCancelConfirm').addEventListener('click', closeConfirmModal)
    document.getElementById('btnYesConfirm').addEventListener('click', async () => {
        if (confirmCallback) await confirmCallback()
        closeConfirmModal()
    })

    await loadData()
}

// ── Chargement ──────────────────────────────────────────────────────────────
async function loadData(reset = true) {
    if (reset) { poPage = 0; poLog = [] }
    const from = poPage * PO_PAGE_SIZE
    const to = from + PO_PAGE_SIZE - 1

    const { data, error } = await supabase
        .from('bons_de_commande')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to + 1)

    if (error) { console.error('Erreur chargement PO:', error); return }

    poHasMore = (data || []).length > PO_PAGE_SIZE
    const pageData = (data || []).slice(0, PO_PAGE_SIZE)
    poLog = reset ? pageData : [...poLog, ...pageData]
    filterPO()
}

async function chargerPlusPO() {
    const btn = document.getElementById('btn-charger-plus-po')
    if (btn) { btn.disabled = true; btn.textContent = 'Chargement...' }
    poPage++
    await loadData(false)
}

// ── Génération PO ───────────────────────────────────────────────────────────
async function generatePO() {
    const plumber = document.getElementById('inpPlombier').value.trim()
    const supplier = document.getElementById('inpFournisseur').value.trim()
    const address = document.getElementById('inpAdresse').value.trim()
    const rawDate = document.getElementById('inpDate').value
    const parts = rawDate.split('/')
    const dateReq = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : rawDate
    const hasPhoto = document.getElementById('inpPhoto').files.length > 0

    if (!plumber || !supplier || !address || !dateReq) {
        showAlert('Remplissez tous les champs obligatoires.')
        return
    }

    const newPoNumber = generatePONumber(dateReq)

    const { data, error } = await supabase.from('bons_de_commande').insert([{
        numero: newPoNumber,
        fournisseur: supplier,
        description: address,
        status: 'enregistre',
        author_id: currentUser.id,
        author_nom: plumber,
        date_po: dateReq,
        items: { hasPhoto }
    }]).select().single()

    if (error) { showAlert('Erreur lors de la sauvegarde : ' + error.message); return }

    poLog.unshift(data)
    filterPO()

    document.getElementById('btnGeneratePO').style.display = 'none'
    document.getElementById('displayNewPoNumber').textContent = newPoNumber
    document.getElementById('poResultZone').style.display = 'block'
    switchPoTab('mine')
}

function generatePONumber(dateString) {
    const d = new Date(dateString)
    const yy = String(d.getFullYear()).slice(-2)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const random = Math.floor(1000 + Math.random() * 9000)
    return `PO-${yy}${mm}${dd}-${random}`
}

// ── Rendu liste ─────────────────────────────────────────────────────────────
function formatDateFR(isoDate) {
    if (!isoDate) return ''
    const p = isoDate.split('-')
    return `${p[2]}/${p[1]}/${p[0]}`
}

function renderPOList(list) {
    const container = document.getElementById('poListContainer')
    if (!container) return
    container.innerHTML = ''

    if (list.length === 0) {
        container.innerHTML = '<div style="color:#888;font-style:italic;padding:10px">Aucun bon de commande trouvé.</div>'
        ajouterBoutonPlusPO()
        return
    }

    list.forEach(po => {
        const hasPhoto = po.items?.hasPhoto
        const photoBadge = hasPhoto
            ? `<span style="font-size:12px;color:var(--btn-green);display:flex;align-items:center;gap:4px">
                <svg width="14" height="14" style="stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Photo jointe</span>`
            : ''

        const canDelete = hasPermission('delete_documents') || po.author_id === currentUser.id

        const card = document.createElement('div')
        card.className = 'po-item'
        card.innerHTML = `
            <div class="po-info">
                <div class="po-number">
                    ${po.numero}
                    <span class="status-badge">
                        <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Enregistré
                    </span>
                </div>
                <div class="po-details">
                    <span>
                        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <strong>${po.author_nom || '-'}</strong>
                    </span>
                    <span>
                        <svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/></svg>
                        ${po.fournisseur || '-'}
                    </span>
                    ${photoBadge}
                </div>
                <div class="po-subtext">
                    <span style="display:flex;align-items:center;gap:4px">
                        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${po.description || '-'}
                    </span>
                    <span style="display:flex;align-items:center;gap:4px;margin-left:10px">
                        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${formatDateFR(po.date_po)}
                    </span>
                </div>
            </div>
            <div class="po-actions">
                <button class="btn-copy" data-copy="${po.numero}">
                    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copier
                </button>
                ${canDelete ? `<button class="btn-delete" data-delete="${po.id}">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>` : ''}
            </div>
        `
        container.appendChild(card)
    })

    container.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => copyTextToClipboard(btn.dataset.copy, btn))
    })
    container.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', () => askDeletePO(btn.dataset.delete))
    })

    ajouterBoutonPlusPO()
}

function filterPO() {
    const term = document.getElementById('poSearch')?.value.toLowerCase() || ''
    let baseList = poLog
    if (!hasPermission('view_all_po') || currentPoTab === 'mine') {
        baseList = poLog.filter(po => po.author_id === currentUser.id)
    }
    const filtered = baseList.filter(po =>
        (po.numero || '').toLowerCase().includes(term) ||
        (po.author_nom || '').toLowerCase().includes(term) ||
        (po.fournisseur || '').toLowerCase().includes(term) ||
        (po.description || '').toLowerCase().includes(term) ||
        (po.date_po || '').toLowerCase().includes(term) ||
        formatDateFR(po.date_po).toLowerCase().includes(term)
    )
    renderPOList(filtered)
}

function ajouterBoutonPlusPO() {
    const container = document.getElementById('poListContainer')
    const old = document.getElementById('btn-charger-plus-po')
    if (old) old.remove()
    if (!poHasMore || !container) return
    const btn = document.createElement('button')
    btn.id = 'btn-charger-plus-po'
    btn.textContent = `Charger ${PO_PAGE_SIZE} bons de commande de plus...`
    btn.style.cssText = 'width:100%;padding:14px;margin-top:10px;background:#2b2c36;color:#aaa;border:1px dashed #444;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold'
    btn.addEventListener('click', chargerPlusPO)
    container.appendChild(btn)
}

function switchPoTab(tab) {
    currentPoTab = tab
    document.getElementById('tab-mine').classList.toggle('active', tab === 'mine')
    document.getElementById('tab-all').classList.toggle('active', tab === 'all')
    loadData(true)
}

// ── Fournisseurs ────────────────────────────────────────────────────────────
const DEFAULT_FOURNISSEURS = ['Deschênes', 'Wolseley', 'Plomberie Provinciale']

async function populateFournisseurSelect() {
    let list = DEFAULT_FOURNISSEURS
    try {
        const { data } = await supabase.from('parametres_globaux').select('valeur').eq('cle', 'fournisseurs_recurrents').maybeSingle()
        if (data?.valeur) {
            const parsed = JSON.parse(data.valeur)
            if (Array.isArray(parsed) && parsed.length > 0) list = parsed
        }
    } catch { /* fallback */ }

    const sel = document.getElementById('selFournisseur')
    if (!sel) return
    sel.innerHTML = '<option value="">-- Choisir un fournisseur --</option>'
    list.forEach(f => {
        const opt = document.createElement('option')
        opt.value = f; opt.textContent = f
        sel.appendChild(opt)
    })
    const autre = document.createElement('option')
    autre.value = '__autre__'; autre.textContent = 'Autre...'
    sel.appendChild(autre)
}

function onFournisseurChange() {
    const sel = document.getElementById('selFournisseur')
    const autreInp = document.getElementById('inpFournisseurAutre')
    const hidden = document.getElementById('inpFournisseur')
    if (sel.value === '__autre__') {
        autreInp.style.display = 'block'; autreInp.focus(); hidden.value = autreInp.value.trim()
    } else {
        autreInp.style.display = 'none'; autreInp.value = ''; hidden.value = sel.value
    }
}

// ── Modal PO ────────────────────────────────────────────────────────────────
function openPoModal() {
    document.getElementById('inpPlombier').value = myUserName
    document.getElementById('selFournisseur').value = ''
    document.getElementById('inpFournisseurAutre').value = ''
    document.getElementById('inpFournisseurAutre').style.display = 'none'
    document.getElementById('inpFournisseur').value = ''
    populateFournisseurSelect()
    document.getElementById('inpAdresse').value = ''
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    document.getElementById('inpDate').value = `${dd}/${mm}/${today.getFullYear()}`
    document.getElementById('inpPhoto').value = ''
    document.getElementById('labelPhotoText').textContent = 'Ajouter une photo...'
    document.getElementById('poResultZone').style.display = 'none'
    document.getElementById('btnGeneratePO').style.display = 'flex'
    document.getElementById('poModal').classList.add('open')
}

function updateFileLabel() {
    const input = document.getElementById('inpPhoto')
    const span = document.getElementById('labelPhotoText')
    const label = input.previousElementSibling
    if (input.files && input.files.length > 0) {
        span.textContent = `Photo sélectionnée (${input.files[0].name})`
        label.style.borderColor = 'var(--btn-green)'
        label.style.color = 'var(--btn-green)'
    } else {
        span.textContent = 'Ajouter une photo...'
        label.style.borderColor = '#888'
        label.style.color = '#ccc'
    }
}

function askDeletePO(id) {
    itemToProcessId = id
    document.getElementById('confirmTitle').textContent = 'Supprimer'
    document.getElementById('confirmMsg').textContent = 'Effacer définitivement ce PO ?'
    confirmCallback = async () => {
        const { error } = await supabase.from('bons_de_commande').delete().eq('id', itemToProcessId)
        if (error) { showAlert('Erreur : ' + error.message); return }
        poLog = poLog.filter(po => po.id !== itemToProcessId)
        filterPO()
    }
    document.getElementById('confirmModal').classList.add('open')
}

// ── Utilitaires ─────────────────────────────────────────────────────────────
function copyTextToClipboard(text, btnEl, isLarge = false) {
    navigator.clipboard.writeText(text).then(() => {
        const orig = btnEl.innerHTML
        const origClass = btnEl.className
        btnEl.innerHTML = `<svg width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Copié !`
        btnEl.className = isLarge ? 'btn-copy-large success' : 'btn-copy success'
        btnEl.style.background = 'var(--btn-green)'
        btnEl.style.color = 'white'
        setTimeout(() => {
            btnEl.innerHTML = orig
            btnEl.className = origClass
            btnEl.style.background = ''
            btnEl.style.color = ''
        }, 2000)
    })
}

function autoFormatDatePO(input) {
    let v = input.value.replace(/[^0-9]/g, '')
    if (v.length >= 3 && v.length <= 4) v = v.slice(0, 2) + '/' + v.slice(2)
    else if (v.length >= 5) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4, 8)
    input.value = v
}

function showAlert(msg) {
    document.getElementById('alertMsg').textContent = msg
    document.getElementById('alertModal').classList.add('open')
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open')
}

function closeConfirmModal() {
    closeModal('confirmModal')
    confirmCallback = null
    itemToProcessId = null
}