// src/views/outils.js
// Migré fidèlement depuis code_outils/code_outils.html

import { supabase } from '../supabase.js'
import { currentUser, currentRole, currentProfil, hasPermission } from '../auth.js'

// ── État local ──────────────────────────────────────────────────────────────
let myUserName = 'Employé'
let toolsLog = []
let toolsPage = 0
const TOOLS_PAGE_SIZE = 25
let toolsHasMore = false
let teamMembers = []
let itemToProcess = null
let actionType = null
let pendingTransfersQueue = []
let currentPendingTransfer = null

// ── Render principal ────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        .outils-main { padding: 30px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .btn-action { background-color: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
        .btn-action:hover { background-color: var(--accent-hover); transform: translateY(-2px); }
        .btn-action svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .toolbar { display: flex; gap: 15px; align-items: center; background-color: var(--bg-panel); padding: 15px; border-radius: 12px; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: #1e1f26; border: 1px solid #444; color: white; padding: 14px 15px 14px 45px; border-radius: 8px; font-size: 16px; outline: none; transition: 0.2s; }
        .search-box input:focus { border-color: var(--accent); }
        .search-icon { position: absolute; left: 15px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .section-title { font-size: 16px; color: var(--accent); text-transform: uppercase; margin-top: 10px; margin-bottom: 5px; border-bottom: 1px solid #444; padding-bottom: 5px; }
        .tool-list { display: flex; flex-direction: column; gap: 15px; padding-bottom: 30px; }
        .tool-item { background-color: var(--bg-panel); padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid var(--accent); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .tool-item.returned { border-left-color: var(--btn-green); opacity: 0.7; }
        .tool-info { display: flex; flex-direction: column; gap: 5px; flex: 1; }
        .tool-name { font-size: 18px; font-weight: bold; color: white; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .tool-name svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .tool-details { color: #aaa; font-size: 14px; display: flex; align-items: center; gap: 15px; flex-wrap: wrap; margin-top: 5px; }
        .tool-details span { display: flex; align-items: center; gap: 5px; }
        .tool-details svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .status-badge { font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: bold; text-transform: uppercase; white-space: nowrap; }
        .status-badge.out { background: rgba(252,202,70,0.2); color: var(--accent); border: 1px solid rgba(252,202,70,0.5); }
        .status-badge.in { background: rgba(40,167,69,0.2); color: var(--btn-green); border: 1px solid rgba(40,167,69,0.5); }
        .tool-actions { display: flex; gap: 10px; margin-left: 20px; flex-wrap: wrap; }
        .btn-return { background: var(--btn-green); color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .btn-return svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-return:hover { background: #218838; }
        .btn-transfer { background: var(--btn-blue); color: white; border: none; padding: 10px 15px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .btn-transfer svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-transfer:hover { background: #2980b9; }
        .btn-delete-tool { background: rgba(255,77,77,0.1); color: var(--btn-red); border: 1px solid transparent; width: 40px; height: 40px; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
        .btn-delete-tool svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-delete-tool:hover { background: var(--btn-red); color: white; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: none; z-index: 4000; justify-content: center; align-items: center; }
        .modal-overlay.open { display: flex; }
        .modal-card-basic { background: var(--bg-panel); width: 350px; padding: 25px; border-radius: 15px; text-align: center; border: 1px solid #555; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .modal-actions { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }
        .btn-modal-gray { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-modal-yellow { background: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-modal-green { background: var(--btn-green); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-modal-red { background: var(--btn-red); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }

        .custom-form-card { background: #252631; width: 90%; max-width: 400px; padding: 30px; border-radius: 30px; box-shadow: 0 15px 35px rgba(0,0,0,0.5); position: relative; border: 1px solid #444; max-height: 90vh; overflow-y: auto; }
        .modal-header-custom { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; color: white; font-size: 22px; font-weight: bold; }
        .modal-header-custom svg { width: 35px; height: 35px; stroke: currentColor; fill: none; stroke-width: 2; }
        .custom-group { margin-bottom: 22px; text-align: left; }
        .custom-group label { display: block; color: white; margin-bottom: 7px; font-size: 15px; font-weight: bold; }
        .custom-group input, .custom-group select { width: 100%; padding: 12px 15px; background: #323443; border: 1px solid #444; color: white; border-radius: 8px; font-size: 16px; outline: none; box-sizing: border-box; }
        .custom-group input:focus, .custom-group select:focus { border-color: var(--accent); }
        .btn-custom-submit { background-color: var(--accent); color: black; border: none; width: 100%; padding: 15px; border-radius: 12px; font-weight: bold; font-size: 18px; cursor: pointer; margin-top: 10px; transition: 0.2s; }
        .btn-custom-submit:hover { background-color: var(--accent-hover); }
        .btn-close-modal { position: absolute; top: 15px; right: 20px; background: none; border: none; color: #888; font-size: 30px; cursor: pointer; }
        .btn-close-modal:hover { color: white; }

        @media (max-width: 768px) {
            .outils-main { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; }
            .dash-header .btn-action { width: 100%; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
            .tool-item { flex-direction: column; align-items: flex-start; gap: 15px; padding: 15px; }
            .tool-actions { align-self: stretch; margin-left: 0; width: 100%; }
            .btn-return, .btn-transfer { flex: 1; justify-content: center; }
        }
    </style>

    <div class="outils-main">
        <div class="dash-header">
            <div class="dash-title">
                <h1>Outils</h1>
                <p>Registre d'emprunt du matériel</p>
            </div>
            <button class="btn-action" id="btnBorrow">
                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Emprunter un outil
            </button>
        </div>

        <div class="toolbar">
            <div class="search-box">
                <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                <input type="text" id="toolSearch" placeholder="Rechercher (Plombier, Outil, Adresse...)">
            </div>
        </div>

        <div class="section-title">En cours d'utilisation</div>
        <div class="tool-list" id="activeListContainer"></div>

        <div class="section-title" style="margin-top:20px;color:#888">Historique des retours</div>
        <div class="tool-list" id="historyListContainer"></div>
    </div>

    <!-- Modal emprunt -->
    <div class="modal-overlay" id="borrowModal">
        <div class="custom-form-card">
            <button class="btn-close-modal" id="btnCloseBorrow">×</button>
            <div class="modal-header-custom" style="color:var(--accent)">
                <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                Outil emprunté
            </div>
            <div class="custom-group">
                <label>Nom du plombier</label>
                <input type="text" id="inpPlombier" placeholder="Ex: François">
            </div>
            <div class="custom-group">
                <label>Outil</label>
                <select id="inpOutil">
                    <option value="" disabled selected hidden>Sélectionner une machine...</option>
                    <option value="Autre...">Autre (Préciser en note)</option>
                </select>
            </div>
            <div class="custom-group" id="grpOutilAutre" style="display:none">
                <label>Préciser l'outil <span style="color:var(--btn-red)">*</span></label>
                <input type="text" id="inpOutilAutre" placeholder="Ex: Perceuse, Caméra d'inspection...">
            </div>
            <div class="custom-group">
                <label>Adresse / Lieu</label>
                <input type="text" id="inpAdresse" placeholder="Ex: Camion #4">
            </div>
            <div class="custom-group">
                <label>Date</label>
                <input type="date" id="inpDate">
            </div>
            <button class="btn-custom-submit" id="btnSaveBorrow">Emprunter l'outil</button>
        </div>
    </div>

    <!-- Modal transfert -->
    <div class="modal-overlay" id="transferModal">
        <div class="custom-form-card">
            <button class="btn-close-modal" id="btnCloseTransfer">×</button>
            <div class="modal-header-custom" style="color:var(--btn-blue)">
                <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                Transférer l'outil
            </div>
            <div class="custom-group">
                <label style="color:#aaa">Outil sélectionné :<br><span id="transferToolName" style="color:white;font-size:18px"></span></label>
            </div>
            <div class="custom-group">
                <label>Nouveau responsable (Plombier)</label>
                <select id="inpTransferTo">
                    <option value="" disabled selected hidden>Choisir un collègue...</option>
                </select>
            </div>
            <button class="btn-custom-submit" id="btnExecuteTransfer" style="background:var(--btn-blue);color:white">Confirmer le transfert</button>
        </div>
    </div>

    <!-- Modal réception transfert -->
    <div class="modal-overlay" id="receiveTransferModal">
        <div class="custom-form-card">
            <div class="modal-header-custom" style="color:var(--btn-blue)">
                <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                Transfert d'outil reçu
            </div>
            <div class="custom-group">
                <label style="color:#aaa">
                    <span id="receiveTransferFrom" style="color:var(--accent);font-weight:bold">Quelqu'un</span>
                    souhaite vous transférer :
                </label>
                <div id="receiveTransferToolName" style="color:white;font-size:18px;font-weight:bold;margin-top:8px"></div>
            </div>
            <div class="custom-group">
                <label style="color:#aaa">Lieu actuel : <span id="receiveTransferOldLocation" style="color:white"></span></label>
            </div>
            <div class="custom-group">
                <label>Nouveau lieu de l'outil <span style="color:var(--btn-red)">*</span></label>
                <input type="text" id="inpReceiveNewLocation" placeholder="Ex: Camion, Atelier, Adresse du chantier...">
            </div>
            <div class="modal-actions">
                <button class="btn-modal-gray" style="flex:1" id="btnRefuseTransfer">Refuser</button>
                <button class="btn-modal-green" style="flex:1" id="btnAcceptTransfer">Accepter</button>
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
            <div style="font-size:20px;font-weight:bold;margin-bottom:15px" id="confirmTitle">Action</div>
            <div style="color:#e0e0e0;margin-bottom:25px" id="confirmMsg">Êtes-vous sûr ?</div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCancelConfirm">Annuler</button>
                <button id="btnConfirmAction" class="btn-modal-red">Confirmer</button>
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

    // Boutons
    document.getElementById('btnBorrow').addEventListener('click', openBorrowModal)
    document.getElementById('btnCloseBorrow').addEventListener('click', () => closeModal('borrowModal'))
    document.getElementById('btnSaveBorrow').addEventListener('click', saveBorrow)
    document.getElementById('inpOutil').addEventListener('change', toggleOutilAutre)
    document.getElementById('btnCloseTransfer').addEventListener('click', () => closeModal('transferModal'))
    document.getElementById('btnExecuteTransfer').addEventListener('click', executeTransfer)
    document.getElementById('btnRefuseTransfer').addEventListener('click', refuseTransfer)
    document.getElementById('btnAcceptTransfer').addEventListener('click', acceptTransfer)
    document.getElementById('btnCloseAlert').addEventListener('click', () => closeModal('alertModal'))
    document.getElementById('btnCancelConfirm').addEventListener('click', closeConfirmModal)
    document.getElementById('btnConfirmAction').addEventListener('click', async () => {
        if (!itemToProcess) return
        if (actionType === 'return') await confirmReturn()
        else if (actionType === 'delete') await confirmDelete()
    })
    document.getElementById('toolSearch').addEventListener('keyup', filterTools)

    await fetchTeamMembers()
    await loadTools()
    await checkPendingTransfers()
}

// ── Chargement ──────────────────────────────────────────────────────────────
async function fetchTeamMembers() {
    const { data } = await supabase.from('profils').select('prenom_nom, role').order('role')
    if (data) teamMembers = data
}

async function loadTools(reset = true) {
    if (reset) { toolsPage = 0; toolsLog = [] }
    const from = toolsPage * TOOLS_PAGE_SIZE
    const to = from + TOOLS_PAGE_SIZE - 1

    const { data, error } = await supabase
        .from('outils')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to + 1)

    if (error) { console.error('Erreur chargement outils:', error); return }

    // Migration auto des outils orphelins
    if (reset && data?.length) {
        const orphans = data.filter(t => t.status === 'active' && (!t.assignee_nom || !t.assignee_nom.trim()) && !t.date_transfert)
        if (orphans.length > 0) {
            const ids = orphans.map(o => o.id)
            await supabase.from('outils').update({ status: 'available' }).in('id', ids)
            data.forEach(t => { if (ids.includes(t.id)) t.status = 'available' })
        }
    }

    toolsHasMore = (data || []).length > TOOLS_PAGE_SIZE
    const pageData = (data || []).slice(0, TOOLS_PAGE_SIZE)
    toolsLog = reset ? pageData : [...toolsLog, ...pageData]
    renderTools()
}

async function chargerPlusOutils() {
    const btn = document.getElementById('btn-charger-plus-outils')
    if (btn) { btn.disabled = true; btn.textContent = 'Chargement...' }
    toolsPage++
    await loadTools(false)
}

// ── Rendu ───────────────────────────────────────────────────────────────────
function formatDateFR(isoDate) {
    if (!isoDate) return ''
    const p = isoDate.split('-')
    return `${p[2]}/${p[1]}/${p[0]}`
}

function renderTools(list = toolsLog) {
    const activeContainer = document.getElementById('activeListContainer')
    const historyContainer = document.getElementById('historyListContainer')
    if (!activeContainer || !historyContainer) return
    activeContainer.innerHTML = ''
    historyContainer.innerHTML = ''

    const canManage = hasPermission('manage_tools')
    let hasActive = false, hasHistory = false

    list.forEach(t => {
        if (t.status === 'available') return

        const hasPendingTransfer = !!t.pending_transfer_to
        let badge = t.status === 'active'
            ? `<span class="status-badge out">En cours</span>`
            : `<span class="status-badge in">Retourné</span>`

        if (hasPendingTransfer) {
            badge += ` <span class="status-badge" style="background:rgba(91,192,235,0.15);color:var(--btn-blue);border:1px solid rgba(91,192,235,0.4)">↗ Transfert en attente : ${t.pending_transfer_to}</span>`
        }

        let actionsHTML = ''
        if (t.status === 'active') {
            const isMyTool = (t.assignee_nom || '').trim() === (myUserName || '').trim()
            if (isMyTool) {
                if (hasPendingTransfer) {
                    actionsHTML += `<button class="btn-transfer" style="background:#888" data-cancel="${t.id}">
                        <svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Annuler la demande</button>`
                } else {
                    actionsHTML += `<button class="btn-return" data-return="${t.id}">
                        <svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="20 6 9 17 4 12"/></svg>
                        Marquer retourné</button>`
                    actionsHTML += `<button class="btn-transfer" data-transfer="${t.id}">
                        <svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                        Transférer</button>`
                }
            }
            if (canManage) actionsHTML += `<button class="btn-delete-tool" data-delete="${t.id}">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`
        } else {
            if (canManage) actionsHTML = `<button class="btn-delete-tool" data-delete="${t.id}">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`
        }

        const card = document.createElement('div')
        card.className = `tool-item ${t.status === 'returned' ? 'returned' : ''}`
        card.innerHTML = `
            <div class="tool-info">
                <div class="tool-name">
                    <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    ${t.nom} ${badge}
                </div>
                <div class="tool-details">
                    <span><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><strong>${t.assignee_nom || '-'}</strong></span>
                    <span><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${t.notes || '-'}</span>
                    <span><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Emprunté le ${formatDateFR(t.date_transfert)}</span>
                </div>
            </div>
            <div class="tool-actions">${actionsHTML}</div>
        `

        const target = t.status === 'active' ? activeContainer : historyContainer
        target.appendChild(card)
        if (t.status === 'active') hasActive = true
        else hasHistory = true
    })

    // Brancher les boutons
    activeContainer.querySelectorAll('[data-return]').forEach(btn => btn.addEventListener('click', () => askReturn(btn.dataset.return)))
    activeContainer.querySelectorAll('[data-transfer]').forEach(btn => btn.addEventListener('click', () => openTransferModal(btn.dataset.transfer)))
    activeContainer.querySelectorAll('[data-cancel]').forEach(btn => btn.addEventListener('click', () => cancelPendingTransfer(btn.dataset.cancel)))
    document.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => askDelete(btn.dataset.delete)))

    if (!hasActive) activeContainer.innerHTML = '<div style="color:#888;font-style:italic;padding:10px">Aucun outil actuellement en utilisation.</div>'
    if (!hasHistory) historyContainer.innerHTML = '<div style="color:#888;font-style:italic;padding:10px">Aucun historique de retour.</div>'
    ajouterBoutonPlusOutils()
}

function ajouterBoutonPlusOutils() {
    const histContainer = document.getElementById('historyListContainer')
    const old = document.getElementById('btn-charger-plus-outils')
    if (old) old.remove()
    if (!toolsHasMore || !histContainer) return
    const btn = document.createElement('button')
    btn.id = 'btn-charger-plus-outils'
    btn.textContent = `Charger ${TOOLS_PAGE_SIZE} entrées de plus...`
    btn.style.cssText = 'width:100%;padding:14px;margin-top:10px;background:#2b2c36;color:#aaa;border:1px dashed #444;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold'
    btn.addEventListener('click', chargerPlusOutils)
    histContainer.appendChild(btn)
}

function filterTools() {
    const term = document.getElementById('toolSearch')?.value.toLowerCase() || ''
    const filtered = toolsLog.filter(t =>
        (t.assignee_nom || '').toLowerCase().includes(term) ||
        (t.nom || '').toLowerCase().includes(term) ||
        (t.notes || '').toLowerCase().includes(term)
    )
    renderTools(filtered)
}

// ── Dropdown outils ─────────────────────────────────────────────────────────
async function updateToolDropdown() {
    const select = document.getElementById('inpOutil')
    if (!select) return

    let toolNames = []
    try {
        const { data } = await supabase
            .from('outils')
            .select('nom, position')
            .order('position', { ascending: true, nullsFirst: false })
            .order('nom', { ascending: true })
        const seen = new Set()
        ;(data || []).forEach(t => {
            if (!t.nom) return
            const key = t.nom.toLowerCase().trim()
            if (seen.has(key)) return
            seen.add(key)
            toolNames.push(t.nom)
        })
    } catch { /* fallback */ }

    const activeTools = toolsLog.filter(t => t.status === 'active').map(t => t.nom)
    let html = '<option value="" disabled selected hidden>Sélectionner une machine...</option>'
    toolNames.forEach(name => {
        const isActive = activeTools.includes(name)
        const safe = name.replace(/"/g, '&quot;')
        html += `<option value="${safe}"${isActive ? ' disabled' : ''}>${safe}${isActive ? ' — Indisponible' : ''}</option>`
    })
    html += '<option value="Autre...">Autre (Préciser en note)</option>'
    select.innerHTML = html
}

function toggleOutilAutre() {
    const sel = document.getElementById('inpOutil')
    const grp = document.getElementById('grpOutilAutre')
    const inp = document.getElementById('inpOutilAutre')
    if (sel.value === 'Autre...') { grp.style.display = ''; inp?.focus() }
    else { grp.style.display = 'none'; if (inp) inp.value = '' }
}

// ── Emprunt ─────────────────────────────────────────────────────────────────
async function openBorrowModal() {
    await updateToolDropdown()
    document.getElementById('inpPlombier').value = myUserName
    document.getElementById('inpOutil').value = ''
    document.getElementById('inpAdresse').value = ''
    document.getElementById('inpDate').value = new Date().toISOString().split('T')[0]
    const inpAutre = document.getElementById('inpOutilAutre')
    const grpAutre = document.getElementById('grpOutilAutre')
    if (inpAutre) inpAutre.value = ''
    if (grpAutre) grpAutre.style.display = 'none'
    document.getElementById('borrowModal').classList.add('open')
}

async function saveBorrow() {
    const plumber = document.getElementById('inpPlombier').value.trim()
    const toolSelected = document.getElementById('inpOutil').value
    const address = document.getElementById('inpAdresse').value.trim()
    const dateOut = document.getElementById('inpDate').value

    if (!plumber || !toolSelected || !address || !dateOut) { showAlert('Merci de remplir tous les champs.'); return }

    let tool = toolSelected
    if (toolSelected === 'Autre...') {
        const customName = document.getElementById('inpOutilAutre').value.trim()
        if (!customName) { showAlert("Veuillez préciser le nom de l'outil."); return }
        tool = customName
    }

    const activeTools = toolsLog.filter(t => t.status === 'active').map(t => t.nom)
    if (toolSelected !== 'Autre...' && activeTools.includes(tool)) {
        showAlert("Cet outil est déjà emprunté et n'a pas encore été retourné."); return
    }

    const { error } = await supabase.from('outils').insert([{
        nom: tool, assignee_nom: plumber, notes: address,
        date_transfert: dateOut, status: 'active'
    }])

    if (error) { showAlert('Erreur : ' + error.message); return }
    await loadTools()
    closeModal('borrowModal')
}

// ── Retour ──────────────────────────────────────────────────────────────────
function askReturn(id) {
    itemToProcess = id; actionType = 'return'
    document.getElementById('confirmTitle').textContent = "Retour d'outil"
    document.getElementById('confirmTitle').style.color = 'var(--btn-green)'
    document.getElementById('confirmMsg').textContent = 'Confirmer que cet outil a été ramené ?'
    const btn = document.getElementById('btnConfirmAction')
    btn.textContent = 'Oui, retourné'; btn.className = 'btn-modal-green'
    document.getElementById('confirmModal').classList.add('open')
}

async function confirmReturn() {
    const today = new Date().toISOString().split('T')[0]
    const tool = toolsLog.find(t => t.id === itemToProcess)
    const { error } = await supabase.from('outils').update({
        status: 'returned',
        notes: (tool?.notes || '') + ' | Retourné: ' + today
    }).eq('id', itemToProcess)
    if (error) { showAlert('Erreur : ' + error.message); return }
    await loadTools()
    closeConfirmModal()
}

// ── Suppression ─────────────────────────────────────────────────────────────
function askDelete(id) {
    itemToProcess = id; actionType = 'delete'
    document.getElementById('confirmTitle').textContent = 'Supprimer'
    document.getElementById('confirmTitle').style.color = 'var(--btn-red)'
    document.getElementById('confirmMsg').textContent = 'Effacer définitivement cet enregistrement ?'
    const btn = document.getElementById('btnConfirmAction')
    btn.textContent = 'Supprimer'; btn.className = 'btn-modal-red'
    document.getElementById('confirmModal').classList.add('open')
}

async function confirmDelete() {
    const { error } = await supabase.from('outils').delete().eq('id', itemToProcess)
    if (error) { showAlert('Erreur : ' + error.message); return }
    await loadTools()
    closeConfirmModal()
}

// ── Transfert ───────────────────────────────────────────────────────────────
function openTransferModal(toolId) {
    itemToProcess = toolId
    const t = toolsLog.find(x => x.id === toolId)
    if (!t) return

    if (t.pending_transfer_to) {
        showAlert(`Un transfert vers ${t.pending_transfer_to} est déjà en attente.`); return
    }

    document.getElementById('transferToolName').textContent = t.nom
    const sel = document.getElementById('inpTransferTo')
    sel.innerHTML = '<option value="" disabled selected hidden>Choisir un collègue...</option>'
    teamMembers.forEach(emp => {
        if (emp.prenom_nom && emp.prenom_nom !== t.assignee_nom) {
            sel.innerHTML += `<option value="${emp.prenom_nom}">${emp.prenom_nom}</option>`
        }
    })
    document.getElementById('transferModal').classList.add('open')
}

async function executeTransfer() {
    const newPlumber = document.getElementById('inpTransferTo').value
    if (!newPlumber) { showAlert('Veuillez sélectionner un employé.'); return }

    const { error } = await supabase.from('outils').update({
        pending_transfer_to: newPlumber,
        pending_transfer_at: new Date().toISOString()
    }).eq('id', itemToProcess)

    if (error) { showAlert('Erreur : ' + error.message); return }
    await loadTools()
    closeModal('transferModal')
    showAlert(`Demande de transfert envoyée à ${newPlumber}. L'outil restera à votre nom tant qu'il n'aura pas confirmé.`)
}

async function cancelPendingTransfer(toolId) {
    const t = toolsLog.find(x => x.id === toolId)
    if (!t?.pending_transfer_to) return

    const { error } = await supabase.from('outils').update({
        pending_transfer_to: null, pending_transfer_at: null
    }).eq('id', toolId)

    if (error) { showAlert('Erreur : ' + error.message); return }
    await loadTools()
    showAlert(`Demande de transfert à ${t.pending_transfer_to} annulée.`)
}

// ── Réception transfert ─────────────────────────────────────────────────────
async function checkPendingTransfers() {
    const { data, error } = await supabase
        .from('outils')
        .select('id, nom, assignee_nom, notes, pending_transfer_to, pending_transfer_at')
        .eq('pending_transfer_to', myUserName)
        .eq('status', 'active')

    if (error || !data?.length) return
    pendingTransfersQueue = data
    showNextPendingTransfer()
}

function showNextPendingTransfer() {
    if (pendingTransfersQueue.length === 0) { currentPendingTransfer = null; return }
    currentPendingTransfer = pendingTransfersQueue.shift()
    document.getElementById('receiveTransferFrom').textContent = currentPendingTransfer.assignee_nom || 'Quelqu\'un'
    document.getElementById('receiveTransferToolName').textContent = currentPendingTransfer.nom || '-'
    document.getElementById('receiveTransferOldLocation').textContent = currentPendingTransfer.notes || '-'
    document.getElementById('inpReceiveNewLocation').value = ''
    document.getElementById('receiveTransferModal').classList.add('open')
}

async function acceptTransfer() {
    if (!currentPendingTransfer) return
    const newLocation = document.getElementById('inpReceiveNewLocation').value.trim()
    if (!newLocation) { showAlert("Veuillez indiquer le nouveau lieu de l'outil avant d'accepter."); return }

    const { error } = await supabase.from('outils').update({
        assignee_nom: myUserName, notes: newLocation,
        pending_transfer_to: null, pending_transfer_at: null
    }).eq('id', currentPendingTransfer.id)

    if (error) { showAlert('Erreur : ' + error.message); return }

    const fromName = currentPendingTransfer.assignee_nom
    const toolName = currentPendingTransfer.nom
    closeModal('receiveTransferModal')
    await loadTools()
    showAlert(`Transfert accepté. L'outil "${toolName}" vous a été transmis par ${fromName}.`)
    setTimeout(showNextPendingTransfer, 500)
}

async function refuseTransfer() {
    if (!currentPendingTransfer) return

    const { error } = await supabase.from('outils').update({
        pending_transfer_to: null, pending_transfer_at: null
    }).eq('id', currentPendingTransfer.id)

    if (error) { showAlert('Erreur : ' + error.message); return }

    const fromName = currentPendingTransfer.assignee_nom
    const toolName = currentPendingTransfer.nom
    closeModal('receiveTransferModal')
    await loadTools()
    showAlert(`Transfert refusé. L'outil "${toolName}" reste assigné à ${fromName}.`)
    setTimeout(showNextPendingTransfer, 500)
}

// ── Utilitaires ─────────────────────────────────────────────────────────────
function showAlert(msg) {
    document.getElementById('alertMsg').textContent = msg
    document.getElementById('alertModal').classList.add('open')
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open')
}

function closeConfirmModal() {
    closeModal('confirmModal')
    itemToProcess = null
    actionType = null
}