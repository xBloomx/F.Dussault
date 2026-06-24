// src/views/po.js

import { supabase } from '../supabase.js'
import { currentUser, currentRole, currentProfil, hasPermission } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'

// ── État local ───────────────────────────────────────────────────────────────
let myUserName = 'Employé'
let currentPoTab = 'mine'
let poLog = []
let poPage = 0
const PO_PAGE_SIZE = 25
let poHasMore = false
let itemToProcessId = null
let confirmCallback = null

// ── Render principal ──────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        /* ── PO rows ── */
        .po-list { display: flex; flex-direction: column; gap: 10px; padding-bottom: 40px; }
        .po-row {
            background: var(--bg-panel); border: 1px solid var(--border);
            border-left: 3px solid var(--status-green);
            padding: 16px 20px; border-radius: var(--r-lg,10px);
            display: flex; justify-content: space-between; align-items: center; gap: 16px;
            transition: background var(--t-base), transform var(--t-fast);
        }
        .po-row:hover { background: var(--bg-panel-2); transform: translateX(2px); }
        .po-info { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0; }
        .po-number-line {
            display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
            font-family: var(--font-mono); font-size: 15px; font-weight: 700;
            color: var(--brand-yellow); letter-spacing: 0.5px;
        }
        .po-badge-ok    { background: var(--tint-green); color: var(--status-green); font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: var(--r-sm); font-family: var(--font-sans); letter-spacing: 0.3px; }
        .po-badge-photo { background: var(--tint-blue);  color: var(--status-blue);  font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: var(--r-sm); font-family: var(--font-sans); }
        .po-details-line {
            display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
            color: var(--text-main); font-size: 13px; font-weight: 500;
        }
        .po-detail-item { display: flex; align-items: center; gap: 5px; }
        .po-detail-item svg { width: 13px; height: 13px; stroke: var(--text-faint); fill: none; stroke-width: 2; flex-shrink: 0; }
        .po-sub-line {
            display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
            color: var(--text-faint); font-size: 12px;
        }
        .po-actions { display: flex; gap: 8px; flex-shrink: 0; }

        /* ── Copy button ── */
        .btn-copy-po {
            background: var(--bg-panel-2); border: 1px solid var(--border);
            color: var(--text-muted); padding: 7px 12px; border-radius: var(--r-md,8px);
            font-size: 12px; font-weight: 600; cursor: pointer;
            display: flex; align-items: center; gap: 6px;
            transition: all var(--t-base); font-family: inherit;
        }
        .btn-copy-po svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-copy-po:hover { background: var(--bg-panel-3); color: #fff; border-color: var(--border-strong); }
        .btn-copy-po.success { background: var(--tint-green); color: var(--status-green); border-color: transparent; }

        /* ── Delete button ── */
        .btn-del-po {
            width: 32px; height: 32px; border-radius: var(--r-md,8px);
            background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3);
            color: var(--status-red); display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all var(--t-base); flex-shrink: 0;
        }
        .btn-del-po svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-del-po:hover { background: var(--status-red); color: #fff; border-color: var(--status-red); }

        /* ── Eyebrow yellow ── */
        .eyebrow { color: var(--brand-yellow) !important; }

        /* ── Tab icons ── */
        #poTabs .tab svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }

        /* ── Toolbar / Search (même style que Factures/FdT) ── */
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); color: #fff; padding: 10px 14px 10px 38px; border-radius: var(--r-lg,10px); font-size: 14px; outline: none; transition: border-color var(--t-base); font-family: inherit; }
        .search-box input:focus { border-color: var(--brand-yellow); }
        .search-icon { position: absolute; left: 12px; color: var(--text-faint); pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; }

        /* ── Load more ── */
        .load-more-btn {
            width: 100%; padding: 12px; background: transparent;
            color: var(--text-muted); border: 1px dashed var(--border);
            border-radius: var(--r-lg,10px); cursor: pointer; font-size: 13px;
            font-weight: 600; margin-top: 4px; font-family: inherit;
            transition: border-color var(--t-base);
        }
        .load-more-btn:hover { border-color: var(--brand-yellow); color: var(--brand-yellow); }

        /* ── Form modal ── */
        .po-form-card {
            background: var(--bg-panel); width: 90%; max-width: 460px;
            border-radius: var(--r-xl,14px); border: 1px solid var(--border);
            box-shadow: var(--shadow-lg); overflow-y: auto; max-height: 92vh;
        }
        .po-form-header {
            padding: 20px 24px 0; display: flex; align-items: center;
            justify-content: space-between;
        }
        .po-form-title {
            display: flex; align-items: center; gap: 10px;
            font-size: 18px; font-weight: 700; color: #fff;
        }
        .po-form-title svg { color: var(--brand-yellow); }
        .po-form-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
        .btn-close-po {
            background: none; border: none; color: var(--text-faint);
            font-size: 22px; cursor: pointer; padding: 0; line-height: 1;
            transition: color var(--t-fast);
        }
        .btn-close-po:hover { color: #fff; }

        /* ── Result zone ── */
        .po-result-zone {
            background: var(--bg-sunken,#15161c); border-radius: var(--r-lg,10px);
            padding: 20px; text-align: center; margin-top: 4px;
            border: 1px solid var(--border); display: none;
        }
        .po-result-label { color: var(--text-faint); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .po-result-number {
            color: var(--brand-yellow); font-size: 22px; font-weight: 700;
            font-family: var(--font-mono); letter-spacing: 1px; margin-bottom: 14px;
        }
        .btn-copy-result {
            width: 100%; padding: 11px 16px; background: var(--bg-panel-2);
            border: 1px solid var(--border); color: #fff; border-radius: var(--r-lg,10px);
            font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: all var(--t-base); margin-bottom: 8px;
        }
        .btn-copy-result svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-copy-result:hover { background: var(--bg-panel-3); border-color: var(--border-strong); }
        .btn-copy-result.success { background: var(--tint-green); border-color: transparent; color: var(--status-green); }

        /* ── Upload label ── */
        .file-upload-label {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            width: 100%; background: var(--bg-sunken,#15161c);
            border: 1px dashed var(--border-strong,#3d3e48); color: var(--text-muted);
            padding: 12px; border-radius: var(--r-lg,10px); cursor: pointer;
            font-size: 13px; transition: border-color var(--t-base);
        }
        .file-upload-label svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; flex-shrink: 0; }
        .file-upload-label:hover { border-color: var(--brand-yellow); color: var(--brand-yellow); }

        .po-empty { color: var(--text-faint); font-style: italic; padding: 32px 0; text-align: center; font-size: 13px; }

        /* ── Mobile header ── */
        .po-mobile-header { display: none; align-items: center; gap: 10px; }
        .po-mobile-title { flex: 1; font-size: 22px; font-weight: 700; color: #fff; margin: 0; }
        .po-mobile-menu-btn { background: none; border: none; color: var(--text-muted); padding: 4px; cursor: pointer; display: flex; align-items: center; }
        .po-mobile-menu-btn svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2.2; stroke-linecap: round; }
        .po-mobile-add-btn { background: var(--brand-yellow); border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .po-mobile-add-btn svg { width: 18px; height: 18px; stroke: #1a1b22; fill: none; stroke-width: 2.5; }
        .po-mobile-sub { display: none; font-size: 12px; color: var(--text-faint); margin-top: -6px; }
        /* ── Author avatar in card ── */
        .po-author-mob { display: none; align-items: center; gap: 9px; }
        .po-ava { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .po-mob-fournisseur { display: none; }
        @media (max-width: 900px) { .po-main { padding: 16px; } }
        @media (max-width: 768px) {
            .po-main { padding: 16px 16px 12px; gap: 10px; }
            .po-mobile-header { display: flex; }
            .po-mobile-sub { display: block; }
            .view-header { display: none; }
            .eyebrow { display: none; }
            .tab svg { display: none; }
            .po-row { flex-direction: row; align-items: flex-start; gap: 0; }
            .po-details-line { display: none; }
            .po-author-mob { display: flex; }
            .po-mob-fournisseur { display: flex; }
            .po-sub-line { flex-wrap: nowrap; gap: 10px; overflow: hidden; }
            .po-sub-line .po-detail-item { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .po-actions { display: none; }
            .modal-overlay { align-items: center; }
            .po-form-card { width: 92%; max-width: 480px; border-radius: var(--r-xl,14px); max-height: 92dvh; }
            .toolbar { padding: 0; background: transparent; border: none; }
            .search-box input { border-radius: var(--r-xl,14px); padding: 12px 14px 12px 40px; }
        }
    </style>

    <div class="po-main view">

        <!-- Mobile header -->
        <div class="po-mobile-header">
            <button class="po-mobile-menu-btn" id="po-menu-btn" aria-label="Menu">
                <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 class="po-mobile-title">Demande de PO</h2>
            <button class="po-mobile-add-btn" id="btnNewPOMobile" aria-label="Nouveau PO">
                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
        </div>
        <div class="po-mobile-sub">Générateur de numéros uniques</div>

        <!-- Header -->
        <div class="view-header">
            <div>
                <h1>Demande de PO</h1>
                <p class="sub">Générateur de numéros uniques</p>
            </div>
            <div class="actions">
                <button class="btn btn-primary btn-pill" id="btnNewPO">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Demander un numéro de PO
                </button>
            </div>
        </div>

        <!-- Toolbar recherche -->
        <div class="toolbar">
            <div class="search-box">
                <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                <input type="text" id="poSearch" placeholder="Rechercher (Numéro, Fournisseur, Adresse, Date…)">
            </div>
        </div>

        <!-- Tabs (si permission) -->
        <div id="poTabs" style="display:flex;gap:8px;flex-wrap:wrap">
            <button id="tab-mine" class="tab active">
                <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Mes PO
            </button>
            <button id="tab-all" class="tab" style="display:none">
                <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Tous les PO
            </button>
        </div>

        <!-- Liste -->
        <div class="eyebrow" id="poEyebrow">Liste des PO</div>
        <div class="po-list" id="poListContainer"></div>
    </div>

    <!-- Modal : nouveau PO -->
    <div class="modal-overlay" id="poModal" style="display:none">
        <div class="po-form-card">
            <div class="po-form-header">
                <div class="po-form-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Nouveau Bon de Commande
                </div>
                <button class="btn-close-po" id="btnClosePoModal">×</button>
            </div>
            <div class="po-form-body">
                <div id="poFormZone" style="display:flex;flex-direction:column;gap:14px">
                    <div>
                        <label class="field-label">Nom du plombier</label>
                        <input class="input" type="text" id="inpPlombier" placeholder="Ex: François">
                    </div>
                    <div>
                        <label class="field-label">Fournisseur</label>
                        <select class="select" id="selFournisseur">
                            <option value="">— Choisir un fournisseur —</option>
                        </select>
                        <input class="input" type="text" id="inpFournisseurAutre" placeholder="Nom du fournisseur" style="display:none;margin-top:8px">
                        <input type="hidden" id="inpFournisseur">
                    </div>
                    <div>
                        <label class="field-label">Adresse / Lieu du chantier</label>
                        <input class="input" type="text" id="inpAdresse" placeholder="Adresse du chantier">
                    </div>
                    <div>
                        <label class="field-label">Date</label>
                        <input class="input" type="text" id="inpDate" placeholder="JJ/MM/AAAA" inputmode="numeric" maxlength="10">
                    </div>
                    <div>
                        <label class="field-label">Photo de la soumission / reçu <span style="color:var(--text-faint);font-weight:400">(Optionnel)</span></label>
                        <label class="file-upload-label" for="inpPhoto">
                            <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            <span id="labelPhotoText">Ajouter une photo…</span>
                        </label>
                        <input type="file" id="inpPhoto" accept="image/*" style="display:none">
                    </div>
                    <button class="btn btn-primary" id="btnGeneratePO" style="width:100%;padding:13px;justify-content:center;font-size:14px;margin-top:4px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        Générer le numéro
                    </button>
                </div>

                <div class="po-result-zone" id="poResultZone">
                    <div class="po-result-label">Numéro généré avec succès</div>
                    <div class="po-result-number" id="displayNewPoNumber">PO-XXXXXX-XXXX</div>
                    <button class="btn-copy-result" id="btnCopyMain">
                        <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copier le numéro
                    </button>
                    <p style="font-size:11px;color:var(--text-faint);margin:0">Ce numéro est maintenant enregistré dans votre liste.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal : alerte -->
    <div class="modal-overlay" id="alertModal" style="display:none">
        <div class="modal" style="max-width:360px;text-align:center">
            <div class="modal-title" style="justify-content:center;border-bottom:none;color:var(--brand-yellow);margin-bottom:8px">Information</div>
            <p id="alertMsg" style="color:var(--text-muted);font-size:14px;margin-bottom:0;line-height:1.5"></p>
            <div class="modal-actions" style="justify-content:center;margin-top:20px">
                <button class="btn btn-primary btn-pill" id="btnCloseAlert" style="min-width:100px">Compris</button>
            </div>
        </div>
    </div>

    <!-- Modal : confirmation -->
    <div class="modal-overlay" id="confirmModal" style="display:none">
        <div class="modal" style="max-width:360px;text-align:center">
            <div class="modal-title" style="justify-content:center;border-bottom:none;color:var(--status-red);margin-bottom:8px" id="confirmTitle">Action</div>
            <p id="confirmMsg" style="color:var(--text-muted);font-size:14px;margin-bottom:0;line-height:1.5">Êtes-vous sûr ?</p>
            <div class="modal-actions" style="justify-content:center;margin-top:20px">
                <button class="btn btn-secondary" id="btnCancelConfirm">Annuler</button>
                <button class="btn btn-danger" id="btnYesConfirm">Confirmer</button>
            </div>
        </div>
    </div>
    `

    await init()
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
    if (!currentUser) return
    myUserName = currentProfil?.prenom_nom || currentUser.email.split('@')[0]

    if (hasPermission('view_all_po')) {
        document.getElementById('tab-all').style.display = ''
    }
    document.getElementById('tab-mine').addEventListener('click', () => switchPoTab('mine'))
    document.getElementById('tab-all').addEventListener('click',  () => switchPoTab('all'))

    document.getElementById('poSearch').addEventListener('keyup', filterPO)

    document.getElementById('btnNewPO').addEventListener('click', openPoModal)
    document.getElementById('btnNewPOMobile')?.addEventListener('click', openPoModal)
    document.getElementById('po-menu-btn')?.addEventListener('click', () => document.getElementById('topbar-mobile-menu-btn')?.click())
    document.getElementById('btnClosePoModal').addEventListener('click', () => closeModal('poModal'))
    document.getElementById('btnGeneratePO').addEventListener('click', generatePO)
    document.getElementById('selFournisseur').addEventListener('change', onFournisseurChange)
    document.getElementById('inpFournisseurAutre').addEventListener('input', e => {
        document.getElementById('inpFournisseur').value = e.target.value.trim()
    })
    document.getElementById('inpDate').addEventListener('keyup', e => autoFormatDatePO(e.target))
    document.getElementById('inpPhoto').addEventListener('change', updateFileLabel)
    document.getElementById('btnCopyMain').addEventListener('click', () =>
        copyTextToClipboard(document.getElementById('displayNewPoNumber').textContent, document.getElementById('btnCopyMain'), true)
    )

    document.getElementById('btnCloseAlert').addEventListener('click', () => closeModal('alertModal'))
    document.getElementById('btnCancelConfirm').addEventListener('click', closeConfirmModal)
    document.getElementById('btnYesConfirm').addEventListener('click', async () => {
        const btn = document.getElementById('btnYesConfirm')
        if (btn?.disabled) return
        if (btn) { btn.disabled = true; btn.style.opacity = '0.6' }
        try { if (confirmCallback) await confirmCallback() }
        finally { if (btn) { btn.disabled = false; btn.style.opacity = '' }; closeConfirmModal() }
    })

    // Fermer modales sur fond
    ;['poModal','alertModal','confirmModal'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', e => {
            if (e.target === document.getElementById(id)) closeModal(id)
        })
    })

    await loadData()
}

// ── Chargement ────────────────────────────────────────────────────────────────
async function loadData(reset = true) {
    if (reset) { poPage = 0; poLog = [] }
    const from = poPage * PO_PAGE_SIZE, to = from + PO_PAGE_SIZE - 1

    const { data, error } = await supabase
        .from('bons_de_commande')
        .select('id,created_at,numero,author_id,author_nom,fournisseur,description,date_po,items')
        .order('created_at', { ascending: false })
        .range(from, to + 1)

    if (error) { console.error('Erreur chargement PO:', error); showAlert(friendlyError(error)); return }

    poHasMore = (data || []).length > PO_PAGE_SIZE
    const pageData = (data || []).slice(0, PO_PAGE_SIZE)
    poLog = reset ? pageData : [...poLog, ...pageData]
    filterPO()
}

async function chargerPlusPO() {
    const btn = document.getElementById('btn-charger-plus-po')
    if (btn) { btn.disabled = true; btn.textContent = 'Chargement…' }
    poPage++
    try { await loadData(false) }
    catch (e) { console.error('[po] Erreur page suivante:', e?.message); poPage--; if (btn) { btn.disabled = false; btn.textContent = `Charger ${PO_PAGE_SIZE} bons de commande de plus…` } }
}

// ── Génération PO ─────────────────────────────────────────────────────────────
async function generatePO() {
    const plumber  = document.getElementById('inpPlombier').value.trim()
    const supplier = document.getElementById('inpFournisseur').value.trim()
    const address  = document.getElementById('inpAdresse').value.trim()
    const rawDate  = document.getElementById('inpDate').value
    const parts    = rawDate.split('/')
    const dateReq  = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : rawDate
    const hasPhoto = document.getElementById('inpPhoto').files.length > 0

    if (!plumber || !supplier || !address || !rawDate.trim()) { showAlert('Remplissez tous les champs obligatoires.'); return }
    if (plumber.length > 100 || supplier.length > 200 || address.length > 500) { showAlert('Un ou plusieurs champs dépassent la longueur maximale autorisée.'); return }

    const btn = document.getElementById('btnGeneratePO')
    if (btn?.disabled) return
    if (btn) { btn.disabled = true; btn.textContent = 'Génération…' }

    const newPoNumber = generatePONumber(dateReq)

    try {
        const { data, error } = await supabase.from('bons_de_commande').insert([{
            numero: newPoNumber, fournisseur: supplier, description: address,
            status: 'enregistre', author_id: currentUser.id, author_nom: plumber,
            date_po: dateReq, items: { hasPhoto }
        }]).select().single()

        if (error) { showAlert(friendlyError(error)); return }
        poLog.unshift(data)
        filterPO()

        document.getElementById('btnGeneratePO').style.display = 'none'
        document.getElementById('displayNewPoNumber').textContent = newPoNumber
        document.getElementById('poResultZone').style.display = 'block'
        switchPoTab('mine')
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Générer le numéro' }
    }
}

function generatePONumber(dateString) {
    const d = new Date(dateString)
    const yy = String(d.getFullYear()).slice(-2)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `PO-${yy}${mm}${dd}-${Math.floor(1000 + Math.random() * 9000)}`
}

// ── Rendu liste ───────────────────────────────────────────────────────────────
function formatDateFR(isoDate) {
    if (!isoDate) return ''
    const p = isoDate.split('-')
    return `${p[2]}/${p[1]}/${p[0]}`
}

function renderPOList(list) {
    const container = document.getElementById('poListContainer')
    if (!container) return
    container.innerHTML = ''
    const eyebrow = document.getElementById('poEyebrow')
    if (eyebrow) eyebrow.textContent = `Liste des PO · ${list.length}`

    if (list.length === 0) {
        container.innerHTML = '<div class="po-empty">Aucun bon de commande trouvé.</div>'
        ajouterBoutonPlusPO(); return
    }

    const avaColors = ['#7c3aed','#2563eb','#059669','#dc2626','#d97706','#0891b2','#9333ea','#db2777']
    const avaColor = name => avaColors[(name || '?').charCodeAt(0) % avaColors.length]
    const avaInitials = name => (name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()

    list.forEach(po => {
        const hasPhoto = po.items?.hasPhoto
        const canDelete = hasPermission('delete_documents')
        const authorName = po.author_nom || '—'

        const row = document.createElement('div')
        row.className = 'po-row'
        row.innerHTML = `
            <div class="po-info">
                <div class="po-number-line">
                    ${sanitize(po.numero || '')}
                    <span class="po-badge-ok">● Enregistré</span>
                    ${hasPhoto ? `<span class="po-badge-photo">Photo jointe</span>` : ''}
                </div>
                <div class="po-author-mob">
                    <div class="po-ava" style="background:${avaColor(authorName)}">${avaInitials(sanitize(authorName))}</div>
                    <strong>${sanitize(authorName)}</strong>
                </div>
                <div class="po-details-line">
                    <div class="po-detail-item">
                        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <strong>${sanitize(authorName)}</strong>
                    </div>
                    <div class="po-detail-item">
                        <svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01"/></svg>
                        ${sanitize(po.fournisseur || '—')}
                    </div>
                </div>
                <div class="po-sub-line">
                    <div class="po-detail-item po-mob-fournisseur">
                        <svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01"/></svg>
                        ${sanitize(po.fournisseur || '—')}
                    </div>
                    <div class="po-detail-item">
                        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${sanitize(po.description || '—')}
                    </div>
                    <div class="po-detail-item">
                        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${sanitize(formatDateFR(po.date_po))}
                    </div>
                </div>
            </div>
            <div class="po-actions">
                <button class="btn-copy-po" data-copy="${sanitize(po.numero)}">
                    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copier
                </button>
                ${canDelete ? `<button class="btn-del-po" data-delete="${po.id}" title="Supprimer">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>` : ''}
            </div>
        `
        container.appendChild(row)
    })

    container.querySelectorAll('[data-copy]').forEach(btn =>
        btn.addEventListener('click', () => copyTextToClipboard(btn.dataset.copy, btn))
    )
    container.querySelectorAll('[data-delete]').forEach(btn =>
        btn.addEventListener('click', () => askDeletePO(btn.dataset.delete))
    )

    ajouterBoutonPlusPO()
}

function filterPO() {
    const term = document.getElementById('poSearch')?.value.toLowerCase() || ''
    let base = poLog
    if (!hasPermission('view_all_po') || currentPoTab === 'mine')
        base = poLog.filter(po => po.author_id === currentUser.id)
    const filtered = base.filter(po =>
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
    document.getElementById('btn-charger-plus-po')?.remove()
    if (!poHasMore || !container) return
    const btn = document.createElement('button')
    btn.id = 'btn-charger-plus-po'
    btn.className = 'load-more-btn'
    btn.textContent = `Charger ${PO_PAGE_SIZE} bons de commande de plus…`
    btn.addEventListener('click', chargerPlusPO)
    container.appendChild(btn)
}

function switchPoTab(tab) {
    currentPoTab = tab
    document.getElementById('tab-mine').classList.toggle('active', tab === 'mine')
    document.getElementById('tab-all').classList.toggle('active',  tab === 'all')
    loadData(true)
}

// ── Fournisseurs ──────────────────────────────────────────────────────────────
const DEFAULT_FOURNISSEURS = ['Deschênes', 'Wolseley', 'Plomberie Provinciale']

async function populateFournisseurSelect() {
    let list = DEFAULT_FOURNISSEURS
    try {
        const { data } = await supabase.from('parametres_globaux').select('valeur').eq('cle', 'fournisseurs_recurrents').maybeSingle()
        if (data?.valeur) { const p = JSON.parse(data.valeur); if (Array.isArray(p) && p.length > 0) list = p }
    } catch { /* fallback */ }
    const sel = document.getElementById('selFournisseur')
    if (!sel) return
    sel.innerHTML = '<option value="">— Choisir un fournisseur —</option>'
    list.forEach(f => { const o = document.createElement('option'); o.value = f; o.textContent = f; sel.appendChild(o) })
    const autre = document.createElement('option'); autre.value = '__autre__'; autre.textContent = 'Autre…'
    sel.appendChild(autre)
}

function onFournisseurChange() {
    const sel    = document.getElementById('selFournisseur')
    const autreI = document.getElementById('inpFournisseurAutre')
    const hidden = document.getElementById('inpFournisseur')
    if (sel.value === '__autre__') { autreI.style.display = 'block'; autreI.focus(); hidden.value = autreI.value.trim() }
    else { autreI.style.display = 'none'; autreI.value = ''; hidden.value = sel.value }
}

// ── Modal PO ──────────────────────────────────────────────────────────────────
function openPoModal() {
    document.getElementById('inpPlombier').value           = myUserName
    document.getElementById('selFournisseur').value        = ''
    document.getElementById('inpFournisseurAutre').value   = ''
    document.getElementById('inpFournisseurAutre').style.display = 'none'
    document.getElementById('inpFournisseur').value        = ''
    populateFournisseurSelect()
    document.getElementById('inpAdresse').value            = ''
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    document.getElementById('inpDate').value               = `${dd}/${mm}/${today.getFullYear()}`
    document.getElementById('inpPhoto').value              = ''
    document.getElementById('labelPhotoText').textContent  = 'Ajouter une photo…'
    document.getElementById('poResultZone').style.display  = 'none'
    document.getElementById('btnGeneratePO').style.display = 'flex'
    document.getElementById('poModal').style.display       = 'flex'
}

function updateFileLabel() {
    const input = document.getElementById('inpPhoto')
    const span  = document.getElementById('labelPhotoText')
    const label = document.querySelector('.file-upload-label')
    if (input.files && input.files.length > 0) {
        span.textContent = `Photo sélectionnée (${input.files[0].name})`
        label.style.borderColor = 'var(--status-green)'; label.style.color = 'var(--status-green)'
    } else {
        span.textContent = 'Ajouter une photo…'
        label.style.borderColor = ''; label.style.color = ''
    }
}

function askDeletePO(id) {
    itemToProcessId = id
    document.getElementById('confirmTitle').textContent = 'Supprimer'
    document.getElementById('confirmMsg').textContent   = 'Effacer définitivement ce PO ?'
    confirmCallback = async () => {
        const { error } = await supabase.from('bons_de_commande').delete().eq('id', itemToProcessId)
        if (error) { showAlert(friendlyError(error)); return }
        poLog = poLog.filter(po => po.id !== itemToProcessId)
        filterPO()
    }
    document.getElementById('confirmModal').style.display = 'flex'
}

// ── Utilitaires ───────────────────────────────────────────────────────────────
function copyTextToClipboard(text, btnEl, isResult = false) {
    navigator.clipboard.writeText(text).then(() => {
        const orig = btnEl.innerHTML, origClass = btnEl.className
        const checkSVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
        btnEl.innerHTML = `${checkSVG} Copié !`
        btnEl.classList.add('success')
        setTimeout(() => { btnEl.innerHTML = orig; btnEl.className = origClass }, 2000)
    })
}

function autoFormatDatePO(input) {
    let v = input.value.replace(/[^0-9]/g, '')
    if (v.length >= 3 && v.length <= 4)  v = v.slice(0, 2) + '/' + v.slice(2)
    else if (v.length >= 5) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4, 8)
    input.value = v
}

function showAlert(msg) {
    document.getElementById('alertMsg').textContent = msg
    document.getElementById('alertModal').style.display = 'flex'
}

function closeModal(id) {
    const el = document.getElementById(id); if (el) el.style.display = 'none'
}

function closeConfirmModal() {
    closeModal('confirmModal'); confirmCallback = null; itemToProcessId = null
}
