// src/views/profil.js

import { supabase } from '../supabase.js'
import { currentUser, currentRole, logout } from '../auth.js'
import { showToast } from '../shared/toast.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'

// ── État local ───────────────────────────────────────────────────────────────
let formations = []
let currentFormationImageBase64 = null
let loadedValues = {}

// ── SVG helpers ───────────────────────────────────────────────────────────────
const IC = {
    user:    `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    shield:  `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    award:   `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    bug:     `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    plus:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    check:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    trash:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    logout:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    camera:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
    send:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    lock:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    renew:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
}

// ── Render principal ──────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        /* ── Form fields ── */
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .field-wrap { display: flex; flex-direction: column; gap: 14px; }
        .card-icon-dot {
            width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
        }

        /* ── Certifications list ── */
        .formation-list { display: flex; flex-direction: column; gap: 8px; }
        .formation-item {
            background: var(--bg-sunken, #15161c); border: 1px solid var(--border);
            border-radius: var(--r-lg, 10px); padding: 10px 12px;
            display: flex; align-items: center; gap: 12px;
        }
        .formation-item.exp    { border-left: 3px solid var(--status-red); }
        .formation-item.warn   { border-left: 3px solid var(--status-amber); }
        .formation-item.ok     { border-left: 3px solid var(--status-green); }
        .form-thumb {
            width: 48px; height: 48px; border-radius: 8px; object-fit: cover;
            cursor: pointer; border: 1px solid var(--border);
            background: var(--bg-panel); display: flex; align-items: center;
            justify-content: center; font-size: 9px; color: var(--text-faint);
            flex-shrink: 0; text-align: center; transition: transform var(--t-fast);
        }
        img.form-thumb:hover { transform: scale(1.05); }
        .form-info { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
        .form-name { font-weight: 600; font-size: 13px; color: #fff; }
        .form-date { font-size: 11px; color: var(--text-muted); }
        .form-badge {
            font-size: 10px; font-weight: 700; padding: 2px 8px;
            border-radius: 999px; white-space: nowrap;
        }
        .form-badge.ok   { background: var(--tint-green);  color: var(--status-green); }
        .form-badge.warn { background: var(--tint-amber);  color: var(--status-amber); }
        .form-badge.exp  { background: var(--tint-red);    color: var(--status-red); }
        .btn-del-form {
            width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
            background: transparent; border: 1px solid var(--border);
            color: var(--text-muted); display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all var(--t-base);
        }
        .btn-del-form:hover { background: var(--tint-red); color: var(--status-red); border-color: var(--status-red); }

        /* ── Image upload ── */
        .img-upload-label {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            width: 100%; background: var(--bg-sunken, #15161c);
            border: 1px dashed var(--border-strong, #3d3e48); color: var(--text-muted);
            padding: 13px; border-radius: var(--r-lg, 10px); cursor: pointer;
            font-size: 13px; transition: border-color var(--t-base);
        }
        .img-upload-label:hover { border-color: var(--brand-yellow); }
        .img-preview {
            width: 100%; max-height: 150px; object-fit: contain;
            border-radius: var(--r-lg, 10px); margin-top: 10px; display: none;
            border: 1px solid var(--border);
        }

        /* ── Logout pill button ── */
        .btn-logout {
            background: transparent; color: var(--status-red);
            border: 1.5px solid var(--status-red);
            padding: 9px 18px; border-radius: var(--r-pill, 999px);
            font-weight: 600; font-size: 13px; cursor: pointer;
            display: inline-flex; align-items: center; gap: 8px;
            font-family: inherit; transition: background var(--t-base);
        }
        .btn-logout:hover { background: var(--tint-red); }

        /* ── Action buttons full-width ── */
        .btn-full {
            width: 100%; padding: 11px 16px; border: none;
            border-radius: var(--r-lg, 10px); font-weight: 600; font-size: 13px;
            cursor: pointer; font-family: inherit;
            display: inline-flex; align-items: center; justify-content: center; gap: 8px;
            transition: opacity var(--t-base), background var(--t-base);
        }
        .btn-full:hover { opacity: 0.88; }

        .profil-page-header { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .profil-page-header-text { flex: 1; min-width: 0; }
        .profil-page-header-text h1 { margin: 0; font-size: var(--fs-4xl); color: #fff; font-weight: 700; letter-spacing: -0.4px; }
        .profil-page-header-text p { margin: 4px 0 0; color: var(--text-muted); font-size: var(--fs-base); font-weight: 500; }
        #profilMenuBtn { display: none; width: 36px; height: 36px; flex-shrink: 0; background: none; border: none; padding: 0; align-items: center; justify-content: center; color: var(--text-muted); cursor: pointer; }
        .profil-logout-icon-btn { background: transparent; color: var(--status-red); border: 1.5px solid var(--status-red); border-radius: 8px; width: 36px; height: 36px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background var(--t-base); }
        .profil-logout-icon-btn:hover { background: var(--tint-red); }
        .profil-logout-icon-btn svg { width: 18px; height: 18px; }
        @media (max-width: 900px) { .bottom-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } #profilMenuBtn { display: flex; } }
    </style>

    <div class="view">

        <!-- ── Header ── -->
        <div class="profil-page-header">
            <button id="profilMenuBtn" aria-label="Menu">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div class="profil-page-header-text">
                <h1>Mon Profil</h1>
                <p>Compte personnel et certifications</p>
            </div>
            <button class="profil-logout-icon-btn" id="btnLogout" title="Déconnexion" aria-label="Déconnexion">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
        </div>

        <!-- ── Informations personnelles ── -->
        <div class="card" style="border-left: 3px solid var(--brand-yellow)">
            <div class="card-title">
                <div class="card-title-left">
                    <div class="card-icon-dot" style="background:rgba(252,202,70,0.12);color:var(--brand-yellow)">${IC.user}</div>
                    Informations personnelles
                </div>
            </div>
            <div class="field-wrap">
                <div class="form-row">
                    <div>
                        <label class="field-label">Prénom</label>
                        <input class="input" type="text" id="profPrenom" placeholder="Ex: Frédéric">
                    </div>
                    <div>
                        <label class="field-label">Nom</label>
                        <input class="input" type="text" id="profNom" placeholder="Ex: Dussault">
                    </div>
                </div>
                <div class="form-row">
                    <div>
                        <label class="field-label">Courriel</label>
                        <input class="input" type="email" id="profEmail" placeholder="Ex: fred@fdussault.ca">
                    </div>
                    <div>
                        <label class="field-label">Téléphone</label>
                        <input class="input" type="text" id="profPhone" placeholder="Ex: 514-527-2119" style="font-family:var(--font-mono)">
                    </div>
                </div>
                <div>
                    <label class="field-label">Adresse</label>
                    <input class="input" type="text" id="profAdresse" placeholder="Ex: 1750 rue Beaudry, Montréal (QC)">
                </div>
                <div class="form-row">
                    <div>
                        <label class="field-label">Numéro CCQ</label>
                        <input class="input" type="text" id="profCCQ" placeholder="Ex: CCQ-44829-77" style="font-family:var(--font-mono)">
                    </div>
                    <div>
                        <label class="field-label">Métier</label>
                        <select class="select" id="profMetier">
                            <option value="">— Chargement… —</option>
                        </select>
                    </div>
                </div>
                <div style="display:flex;justify-content:flex-end;margin-top:4px">
                    <button class="btn btn-primary" id="btnSaveInfo">${IC.check} Enregistrer</button>
                </div>
            </div>
        </div>

        <!-- ── Grille bas ── -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:stretch;padding-bottom:30px" class="bottom-grid">

            <!-- Colonne gauche : Sécurité + Support -->
            <div style="display:flex;flex-direction:column;gap:16px">

                <!-- Sécurité -->
                <div class="card" style="border-left: 3px solid var(--status-blue)">
                    <div class="card-title">
                        <div class="card-title-left">
                            <div class="card-icon-dot" style="background:var(--tint-blue);color:var(--status-blue)">${IC.shield}</div>
                            Sécurité du compte
                        </div>
                    </div>
                    <div class="field-wrap">
                        <div>
                            <label class="field-label">Ancien mot de passe</label>
                            <input class="input" type="password" id="oldPassword" placeholder="Mot de passe actuel">
                        </div>
                        <div>
                            <label class="field-label">Nouveau mot de passe</label>
                            <input class="input" type="password" id="newPassword" placeholder="Min. 6 caractères">
                        </div>
                        <div>
                            <label class="field-label">Confirmer le nouveau mot de passe</label>
                            <input class="input" type="password" id="confirmPassword" placeholder="Répéter">
                        </div>
                        <button class="btn-full" id="btnUpdatePwd"
                            style="background:var(--status-blue);color:#fff;margin-top:4px">
                            ${IC.lock} Mettre à jour mon mot de passe
                        </button>
                    </div>
                </div>

                <!-- Support -->
                <div class="card" style="border-left: 3px solid var(--status-orange)">
                    <div class="card-title">
                        <div class="card-title-left">
                            <div class="card-icon-dot" style="background:var(--tint-orange);color:var(--status-orange)">${IC.bug}</div>
                            Support technique
                        </div>
                    </div>
                    <p style="color:var(--text-muted);font-size:12px;margin:0 0 14px">
                        Un bug ? Une suggestion ? Envoyez un message direct au développeur.
                    </p>
                    <button class="btn-full" id="btnOpenTicket"
                        style="background:var(--status-orange);color:#1a1b22">
                        ${IC.bug} Signaler un problème
                    </button>
                </div>
            </div>

            <!-- Colonne droite : Certifications -->
            <div class="card" style="border-left: 3px solid var(--status-green)">
                <div class="card-title">
                    <div class="card-title-left">
                        <div class="card-icon-dot" style="background:var(--tint-green);color:var(--status-green)">${IC.award}</div>
                        Mes certifications
                    </div>
                    <button class="btn" id="btnAddFormation" style="padding:6px 14px;font-size:12px;font-weight:700;background:var(--tint-green);color:var(--status-green);border:1px solid var(--status-green);border-radius:var(--r-lg,10px)">
                        ${IC.plus} Ajouter
                    </button>
                </div>
                <p style="color:var(--text-muted);font-size:12px;margin:0 0 14px">
                    Vos cartes s'afficheront dans le calendrier lors de leur expiration.
                </p>
                <div class="formation-list" id="formationList"></div>
            </div>

        </div>
    </div>

    <!-- ── Modal : nouvelle certification ── -->
    <div class="modal-overlay" id="formationModal" style="display:none">
        <div class="modal" style="max-width:420px">
            <div class="modal-title">${IC.award} Nouvelle carte</div>
            <div style="display:flex;flex-direction:column;gap:14px">
                <div>
                    <label class="field-label">Nom (Ex : ASP Construction…)</label>
                    <input class="input" type="text" id="inpFormName" placeholder="Nom de la formation">
                </div>
                <div>
                    <label class="field-label">Date d'expiration</label>
                    <input class="input" type="date" id="inpFormDate">
                </div>
                <div>
                    <label class="field-label">Photo de la carte (optionnel)</label>
                    <label class="img-upload-label" for="inpFormImage">
                        ${IC.camera} Photographier / Choisir un fichier…
                    </label>
                    <input type="file" id="inpFormImage" accept="image/*" style="display:none">
                    <img id="formImagePreview" class="img-preview" src="" alt="">
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="btnCancelFormation">Annuler</button>
                <button class="btn btn-primary" id="btnSaveFormation">${IC.check} Enregistrer</button>
            </div>
        </div>
    </div>

    <!-- ── Modal : renouvellement certification ── -->
    <div class="modal-overlay" id="renewModal" style="display:none">
        <div class="modal" style="max-width:420px">
            <div class="modal-title">${IC.renew} Renouveler la certification</div>
            <div style="display:flex;flex-direction:column;gap:14px">
                <div>
                    <label class="field-label">Nouvelle date d'expiration</label>
                    <input class="input" type="date" id="inpRenewDate">
                </div>
                <div>
                    <label class="field-label">Nouvelle photo de la carte (optionnel)</label>
                    <label class="img-upload-label" for="inpRenewImage">
                        ${IC.camera} Photographier / Choisir un fichier…
                    </label>
                    <input type="file" id="inpRenewImage" accept="image/*" style="display:none">
                    <img id="renewImagePreview" class="img-preview" src="" alt="" style="display:none">
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="btnCancelRenew">Annuler</button>
                <button class="btn btn-primary" id="btnSaveRenew" style="background:var(--status-green)">${IC.renew} Renouveler</button>
            </div>
        </div>
    </div>

    <!-- ── Modal : visionneuse image ── -->
    <div class="modal-overlay" id="imageViewerModal" style="display:none">
        <div style="max-width:90%;max-height:90%;text-align:center">
            <img id="fullSizeImage" src="" style="max-width:100%;max-height:80vh;border-radius:var(--r-xl,14px);border:1px solid var(--border)" alt="">
            <div style="margin-top:14px">
                <button class="btn btn-secondary" id="btnCloseViewer">Fermer</button>
            </div>
        </div>
    </div>

    <!-- ── Modal : ticket support ── -->
    <div class="modal-overlay" id="ticketModal" style="display:none">
        <div class="modal" style="max-width:460px">
            <div class="modal-title">${IC.bug} Signaler un problème</div>
            <div style="display:flex;flex-direction:column;gap:14px">
                <div>
                    <label class="field-label">Sujet</label>
                    <input class="input" id="ticketSubject" placeholder="Ex : Impossible de signer une facture">
                </div>
                <div>
                    <label class="field-label">Description</label>
                    <textarea class="textarea" id="ticketMessage" placeholder="Décris ce qui se passe, étape par étape…"></textarea>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="btnCancelTicket">Annuler</button>
                <button class="btn btn-primary" id="btnSendTicket">${IC.send} Envoyer</button>
            </div>
        </div>
    </div>

    <!-- ── Modal : alerte info ── -->
    <div class="modal-overlay" id="alertModal" style="display:none">
        <div class="modal" style="max-width:400px;text-align:center">
            <div class="modal-title" style="justify-content:center;border-bottom:none;margin-bottom:8px">Information</div>
            <p id="alertMsg" style="color:var(--text-muted);font-size:14px;margin-bottom:0;line-height:1.5"></p>
            <div class="modal-actions" style="justify-content:center">
                <button class="btn btn-primary" id="btnCloseAlert">Compris</button>
            </div>
        </div>
    </div>
    `

    return await init()
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
    document.getElementById('btnLogout').addEventListener('click', logout)
    document.getElementById('profilMenuBtn')?.addEventListener('click', () => {
        document.getElementById('topbar-mobile-menu-btn')?.click()
    })
    document.getElementById('btnSaveInfo').addEventListener('click', saveInfoForm)

    document.getElementById('btnAddFormation').addEventListener('click', openFormationModal)
    document.getElementById('btnCancelFormation').addEventListener('click', () => closeModal('formationModal'))
    document.getElementById('btnSaveFormation').addEventListener('click', saveFormation)
    document.getElementById('inpFormImage').addEventListener('change', handleImageUpload)

    document.getElementById('btnCancelRenew').addEventListener('click', () => closeModal('renewModal'))
    document.getElementById('btnSaveRenew').addEventListener('click', saveRenewal)
    document.getElementById('inpRenewImage').addEventListener('change', handleRenewImageUpload)

    document.getElementById('btnCloseViewer').addEventListener('click', () => closeModal('imageViewerModal'))

    document.getElementById('btnOpenTicket').addEventListener('click', () => {
        document.getElementById('ticketMessage').value = ''
        if (document.getElementById('ticketSubject')) document.getElementById('ticketSubject').value = ''
        document.getElementById('ticketModal').style.display = 'flex'
    })
    document.getElementById('btnCancelTicket').addEventListener('click', () => closeModal('ticketModal'))
    document.getElementById('btnSendTicket').addEventListener('click', envoyerTicket)
    document.getElementById('btnUpdatePwd').addEventListener('click', updateMyPassword)
    document.getElementById('btnCloseAlert').addEventListener('click', () => closeModal('alertModal'))

    // Fermer modales sur fond
    ;['formationModal','imageViewerModal','ticketModal','alertModal'].forEach(id => {
        document.getElementById(id).addEventListener('click', e => {
            if (e.target === document.getElementById(id)) closeModal(id)
        })
    })

    await initProfileData()
}

// ── Métiers depuis Supabase ───────────────────────────────────────────────────
async function loadMetiersForSelect() {
    try {
        const { data } = await supabase
            .from('parametres_globaux').select('valeur').eq('cle', 'metiers_liste').maybeSingle()
        const list = data?.valeur ? JSON.parse(data.valeur) : []
        const sel = document.getElementById('profMetier')
        if (!sel) return
        sel.innerHTML = '<option value="">— Sélectionner —</option>' +
            list.map(m => `<option value="${m}">${m}</option>`).join('')
    } catch { /* garder option vide */ }
}

// ── Chargement des données profil ────────────────────────────────────────────
async function initProfileData() {
    if (!currentUser) return
    await loadMetiersForSelect()
    try {
        const { data: profil } = await supabase
            .from('profils')
            .select('prenom, nom, prenom_nom, telephone, courriel, adresse, numero_ccq, metier, role')
            .eq('id', currentUser.id)
            .maybeSingle()

        if (profil) {
            const prenom = profil.prenom || (profil.prenom_nom || '').split(' ')[0] || ''
            const nom    = profil.nom    || (profil.prenom_nom || '').split(' ').slice(1).join(' ') || ''
            document.getElementById('profPrenom').value  = prenom
            document.getElementById('profNom').value     = nom
            document.getElementById('profPhone').value   = profil.telephone || ''
            document.getElementById('profEmail').value   = profil.courriel  || ''
            document.getElementById('profAdresse').value = profil.adresse   || ''
            document.getElementById('profCCQ').value     = profil.numero_ccq || ''
            if (profil.metier) {
                const sel = document.getElementById('profMetier')
                if (sel && !Array.from(sel.options).some(o => o.value === profil.metier))
                    sel.add(new Option(profil.metier, profil.metier))
                sel.value = profil.metier
            }
            loadedValues = {
                prenom, nom,
                telephone:  profil.telephone  || '',
                courriel:   profil.courriel   || '',
                adresse:    profil.adresse    || '',
                numero_ccq: profil.numero_ccq || '',
                metier:     profil.metier     || ''
            }
        }

        const { data: formData } = await supabase
            .from('formations')
            .select('id,nom,date_expiration,image_base64')
            .eq('user_id', currentUser.id)
            .order('date_expiration', { ascending: true })
        formations = (formData || []).map(f => ({
            id: f.id, name: f.nom, dateExp: f.date_expiration, image: f.image_base64
        }))
        renderFormations()
    } catch (e) {
        console.error('Erreur chargement profil:', e)
    }
}

// ── Sauvegarde infos personnelles ────────────────────────────────────────────
async function saveInfoForm() {
    const btn = document.getElementById('btnSaveInfo')
    btn.disabled = true; btn.style.opacity = '0.6'
    try {
        const prenom     = document.getElementById('profPrenom').value.trim()
        const nom        = document.getElementById('profNom').value.trim()
        const telephone  = document.getElementById('profPhone').value.trim()
        const courriel   = document.getElementById('profEmail').value.trim()
        const adresse    = document.getElementById('profAdresse').value.trim()
        const numero_ccq = document.getElementById('profCCQ').value.trim()
        const metier     = document.getElementById('profMetier').value
        const prenom_nom = [prenom, nom].filter(Boolean).join(' ')

        const { error } = await supabase.from('profils').update({
            prenom, nom, prenom_nom, telephone, courriel, adresse, numero_ccq, metier
        }).eq('id', currentUser.id)

        if (error) throw error
        loadedValues = { prenom, nom, telephone, courriel, adresse, numero_ccq, metier }
        showToast('Informations sauvegardées !', 'success')
    } catch (e) {
        showAlert('Erreur : ' + (e.message || friendlyError(e)))
    } finally {
        btn.disabled = false; btn.style.opacity = ''
    }
}

// ── Mot de passe ─────────────────────────────────────────────────────────────
async function updateMyPassword() {
    const oldPwd     = document.getElementById('oldPassword').value
    const newPwd     = document.getElementById('newPassword').value
    const confirmPwd = document.getElementById('confirmPassword').value
    if (!oldPwd || !newPwd || !confirmPwd) return showAlert('Veuillez remplir les trois champs.')
    if (newPwd.length < 6) return showAlert('Le nouveau mot de passe doit contenir au moins 6 caractères.')
    if (newPwd !== confirmPwd) return showAlert('Les deux nouveaux mots de passe ne correspondent pas.')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: oldPwd })
    if (signInError) return showAlert("L'ancien mot de passe est incorrect.")
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) { showAlert(friendlyError(error)); return }
    document.getElementById('oldPassword').value     = ''
    document.getElementById('newPassword').value     = ''
    document.getElementById('confirmPassword').value = ''
    showAlert('Mot de passe mis à jour avec succès !')
}

// ── Certifications ────────────────────────────────────────────────────────────
function renderFormations() {
    const list = document.getElementById('formationList')
    if (!list) return
    list.innerHTML = ''
    if (formations.length === 0) {
        list.innerHTML = `<div style="color:var(--text-faint);font-style:italic;font-size:13px;text-align:center;padding:24px 0">
            Aucune carte ou certification enregistrée.</div>`
        return
    }
    const sorted = [...formations].sort((a, b) => new Date(a.dateExp) - new Date(b.dateExp))
    const today  = new Date()
    sorted.forEach(f => {
        const expDate  = new Date(f.dateExp)
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
        let statusClass = 'ok', statusText = 'À jour'
        if (diffDays < 0)        { statusClass = 'exp';  statusText = 'Expirée' }
        else if (diffDays <= 30) { statusClass = 'warn'; statusText = 'Bientôt' }

        const MOIS_FR = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']
        const dp = (f.dateExp || '').split('-')
        const dateFR = dp.length === 3
            ? `Expire le ${parseInt(dp[2])} ${MOIS_FR[parseInt(dp[1])-1]} ${dp[0]}`
            : f.dateExp

        const imgHTML = f.image
            ? `<img class="form-thumb" src="${f.image}" data-view-id="${f.id}" alt="Carte">`
            : `<div class="form-thumb" style="line-height:1.2">Pas<br>de photo</div>`

        const item = document.createElement('div')
        item.className = `formation-item ${statusClass}`
        item.innerHTML = `
            ${imgHTML}
            <div class="form-info">
                <div class="form-name">${sanitize(f.name || '')}</div>
                <div class="form-date">${sanitize(dateFR)}</div>
            </div>
            <span class="form-badge ${statusClass}">${statusText}</span>
            <button class="btn-renew-form" data-renew-id="${f.id}" title="Renouveler" style="background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);color:var(--status-green);border-radius:var(--r-md,8px);padding:5px 7px;cursor:pointer;display:flex;align-items:center;flex-shrink:0">${IC.renew}</button>
            <button class="btn-del-form" data-del-id="${f.id}" title="Supprimer">${IC.trash}</button>
        `
        list.appendChild(item)
    })
    list.querySelectorAll('[data-view-id]').forEach(img =>
        img.addEventListener('click', () => viewFullImage(img.dataset.viewId))
    )
    list.querySelectorAll('[data-renew-id]').forEach(btn =>
        btn.addEventListener('click', () => openRenewModal(btn.dataset.renewId))
    )
    list.querySelectorAll('[data-del-id]').forEach(btn =>
        btn.addEventListener('click', () => deleteFormation(btn.dataset.delId))
    )
}

function openFormationModal() {
    document.getElementById('inpFormName').value  = ''
    document.getElementById('inpFormDate').value  = ''
    document.getElementById('inpFormImage').value = ''
    document.getElementById('formImagePreview').style.display = 'none'
    currentFormationImageBase64 = null
    document.getElementById('formationModal').style.display = 'flex'
}

function handleImageUpload(event) {
    const file = event.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showAlert('Le fichier sélectionné n\'est pas une image valide.'); event.target.value = ''; return }
    if (file.size > 15 * 1024 * 1024) { showAlert('L\'image est trop volumineuse (max 15 Mo).'); event.target.value = ''; return }
    const reader = new FileReader()
    reader.onload = e => {
        const img = new Image()
        img.onload = () => {
            const MAX = 800; let w = img.width, h = img.height
            if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX } }
            else        { if (h > MAX) { w *= MAX / h; h = MAX } }
            const cvs = document.createElement('canvas')
            cvs.width = w; cvs.height = h
            cvs.getContext('2d').drawImage(img, 0, 0, w, h)
            currentFormationImageBase64 = cvs.toDataURL('image/jpeg', 0.7)
            const preview = document.getElementById('formImagePreview')
            preview.src = currentFormationImageBase64
            preview.style.display = 'block'
        }
        img.src = e.target.result
    }
    reader.readAsDataURL(file)
}

async function saveFormation() {
    const name    = document.getElementById('inpFormName').value.trim()
    const dateExp = document.getElementById('inpFormDate').value
    if (!name || !dateExp) { showAlert("Veuillez remplir le nom et la date d'expiration."); return }
    const { data, error } = await supabase.from('formations').insert([{
        user_id: currentUser.id, nom: name, date_expiration: dateExp, image_base64: currentFormationImageBase64
    }]).select().single()
    if (error) { showAlert(friendlyError(error)); return }
    formations.push({ id: data.id, name: data.nom, dateExp: data.date_expiration, image: data.image_base64 })
    renderFormations()
    closeModal('formationModal')
    window.dispatchEvent(new CustomEvent('formations_updated'))
}

let currentRenewId = null
let renewImageBase64 = null

function openRenewModal(id) {
    currentRenewId = id
    renewImageBase64 = null
    document.getElementById('inpRenewDate').value = ''
    document.getElementById('inpRenewImage').value = ''
    const preview = document.getElementById('renewImagePreview')
    preview.src = ''; preview.style.display = 'none'
    document.getElementById('renewModal').style.display = 'flex'
}

function handleRenewImageUpload(event) {
    const file = event.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showAlert('Le fichier sélectionné n\'est pas une image valide.'); event.target.value = ''; return }
    if (file.size > 15 * 1024 * 1024) { showAlert('L\'image est trop volumineuse (max 15 Mo).'); event.target.value = ''; return }
    const reader = new FileReader()
    reader.onload = e => {
        const img = new Image()
        img.onload = () => {
            const MAX = 800; let w = img.width, h = img.height
            if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX } }
            else        { if (h > MAX) { w *= MAX / h; h = MAX } }
            const cvs = document.createElement('canvas')
            cvs.width = w; cvs.height = h
            cvs.getContext('2d').drawImage(img, 0, 0, w, h)
            renewImageBase64 = cvs.toDataURL('image/jpeg', 0.7)
            const preview = document.getElementById('renewImagePreview')
            preview.src = renewImageBase64; preview.style.display = 'block'
        }
        img.src = e.target.result
    }
    reader.readAsDataURL(file)
}

async function saveRenewal() {
    const dateExp = document.getElementById('inpRenewDate').value
    if (!dateExp) { showAlert("Veuillez entrer la nouvelle date d'expiration."); return }
    const updates = { date_expiration: dateExp }
    if (renewImageBase64) updates.image_base64 = renewImageBase64
    const { error } = await supabase.from('formations').update(updates).eq('id', currentRenewId)
    if (error) { showAlert(friendlyError(error)); return }
    const f = formations.find(f => String(f.id) === String(currentRenewId))
    if (f) { f.dateExp = dateExp; if (renewImageBase64) f.image = renewImageBase64 }
    renderFormations()
    closeModal('renewModal')
    window.dispatchEvent(new CustomEvent('formations_updated'))
}

async function deleteFormation(id) {
    const { error } = await supabase.from('formations').delete().eq('id', id)
    if (error) { showAlert(friendlyError(error)); return }
    formations = formations.filter(f => f.id !== id)
    renderFormations()
    window.dispatchEvent(new CustomEvent('formations_updated'))
}

function viewFullImage(id) {
    const f = formations.find(f => String(f.id) === String(id))
    if (f?.image) {
        document.getElementById('fullSizeImage').src = f.image
        document.getElementById('imageViewerModal').style.display = 'flex'
    }
}

// ── Ticket support ────────────────────────────────────────────────────────────
async function envoyerTicket() {
    const msg     = document.getElementById('ticketMessage').value.trim()
    const subject = document.getElementById('ticketSubject')?.value.trim() || ''
    if (!msg) { showAlert("Veuillez inscrire un message avant d'envoyer."); return }
    const prenom = document.getElementById('profPrenom').value || ''
    const nom    = document.getElementById('profNom').value || ''
    const { error } = await supabase.from('tickets_support').insert([{
        author_id:  currentUser.id,
        author_nom: [prenom, nom].filter(Boolean).join(' ') || 'Employé',
        message:    subject ? `[${subject}] ${msg}` : msg,
        statut:     'ouvert'
    }])
    if (error) { showAlert(friendlyError(error)); return }
    document.getElementById('ticketMessage').value = ''
    if (document.getElementById('ticketSubject')) document.getElementById('ticketSubject').value = ''
    closeModal('ticketModal')
    showAlert('Message envoyé au bureau avec succès !')
}

// ── Utilitaires ───────────────────────────────────────────────────────────────
function showAlert(msg) {
    document.getElementById('alertMsg').textContent = msg
    document.getElementById('alertModal').style.display = 'flex'
}
function closeModal(id) {
    document.getElementById(id).style.display = 'none'
}
