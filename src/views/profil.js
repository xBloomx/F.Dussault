// src/views/profil.js

import { supabase } from '../supabase.js'
import { currentUser, currentRole, logout } from '../auth.js'
import { showToast } from '../shared/toast.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'

// ── État local ──────────────────────────────────────────────────────────────
let formations = []
let currentFormationImageBase64 = null
let canvas, ctx, drawing, signatureHasData
let loadedValues = {}

// ── Render principal ────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }

        .profil-main {
            flex: 1; display: flex; flex-direction: column;
            padding: 30px; max-width: 1200px; margin: 0 auto; width: 100%;
            overflow-y: auto; min-height: 100%; gap: 25px; box-sizing: border-box;
        }

        /* ── Header ── */
        .dash-header { display: flex; justify-content: space-between; align-items: center; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .btn-logout-header {
            background: transparent; color: white; border: 2px solid #555;
            padding: 10px 22px; border-radius: 50px; font-weight: bold; font-size: 14px;
            cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; white-space: nowrap;
        }
        .btn-logout-header svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-logout-header:hover { background: var(--btn-red); border-color: var(--btn-red); }

        /* ── Top section ── */
        .profil-top { display: grid; grid-template-columns: 280px 1fr; gap: 20px; align-items: start; }

        /* ── Profile card (gauche) ── */
        .profile-card {
            background: var(--bg-panel); border-radius: 20px; border: 1px solid #333;
            padding: 30px 20px; display: flex; flex-direction: column; align-items: center; gap: 14px;
        }
        .avatar-circle {
            width: 90px; height: 90px; border-radius: 50%;
            border: 3px solid var(--accent); background: #1a1b23;
            display: flex; align-items: center; justify-content: center;
            font-size: 32px; font-weight: bold; color: var(--accent); flex-shrink: 0; letter-spacing: 1px;
        }
        .profile-name { font-size: 20px; font-weight: bold; color: white; text-align: center; line-height: 1.3; }
        .role-badge {
            background: var(--accent); color: black; font-size: 11px; font-weight: bold;
            padding: 4px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;
        }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; margin-top: 5px; }
        .stat-box {
            background: #1a1b23; border-radius: 12px; padding: 15px 10px;
            display: flex; flex-direction: column; align-items: center; gap: 4px; border: 1px solid #2a2b35;
        }
        .stat-num { font-size: 28px; font-weight: bold; color: white; line-height: 1; }
        .stat-label { font-size: 10px; color: #666; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }

        /* ── Info card (droite) ── */
        .info-card {
            background: var(--bg-panel); border-radius: 20px; border: 1px solid #333;
            padding: 30px; display: flex; flex-direction: column;
        }
        .info-header {
            display: flex; align-items: center; gap: 12px;
            font-size: 20px; font-weight: bold; color: white; margin-bottom: 25px;
        }
        .info-header svg { width: 24px; height: 24px; stroke: var(--accent); fill: none; stroke-width: 2; flex-shrink: 0; }
        .form-group { margin-bottom: 18px; }
        .form-group label { display: block; color: #888; margin-bottom: 7px; font-size: 13px; }
        .form-group input, .form-group select {
            width: 100%; padding: 13px 15px; background: #1a1b23; border: 1px solid #3a3b46;
            color: white; border-radius: 10px; font-size: 15px; outline: none; transition: 0.2s;
            box-sizing: border-box; font-family: inherit;
        }
        .form-group input:focus, .form-group select:focus { border-color: var(--accent); }
        .form-group select { -webkit-appearance: none; appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 42px; }
        .form-row { display: flex; gap: 15px; }
        .form-row .form-group { flex: 1; }
        .info-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 5px; }
        .btn-cancel-info {
            background: #2e2f3a; color: white; border: none; padding: 12px 28px;
            border-radius: 10px; font-size: 14px; font-weight: bold; cursor: pointer; transition: 0.2s;
        }
        .btn-cancel-info:hover { background: #3a3b46; }
        .btn-save-info {
            background: var(--btn-blue); color: white; border: none; padding: 12px 28px;
            border-radius: 10px; font-size: 14px; font-weight: bold; cursor: pointer; transition: 0.2s;
        }
        .btn-save-info:hover { opacity: 0.85; transform: translateY(-1px); }

        /* ── Bottom grid ── */
        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .settings-card {
            background: var(--bg-panel); padding: 25px; border-radius: 15px;
            border: 1px solid #333; display: flex; flex-direction: column;
        }
        .card-header {
            display: flex; align-items: center; justify-content: space-between;
            font-size: 17px; font-weight: bold; color: var(--accent);
            margin-bottom: 20px; border-bottom: 1px solid #444; padding-bottom: 10px;
        }
        .card-header-left { display: flex; align-items: center; gap: 10px; }
        .card-header svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2; }

        /* Signature */
        .signature-container {
            background: white; border-radius: 8px; border: 2px dashed #888;
            height: 180px; position: relative; margin-bottom: 12px; overflow: hidden;
        }
        #sig-canvas { width: 100%; height: 100%; cursor: crosshair; touch-action: none; }
        .sig-actions { display: flex; justify-content: space-between; align-items: center; }
        .btn-clear-sig { background: transparent; color: #aaa; border: none; font-size: 13px; cursor: pointer; text-decoration: underline; padding: 0; }
        .btn-clear-sig:hover { color: white; }
        .btn-save-sig {
            background: var(--btn-purple, #9b59b6); color: white; border: none; padding: 8px 16px;
            border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer; transition: 0.2s;
        }
        .btn-save-sig:hover { opacity: 0.85; }

        /* Certifications */
        .formation-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; max-height: 260px; overflow-y: auto; padding-right: 2px; }
        .formation-item { background: #1a1b23; border: 1px solid #444; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 12px; }
        .form-thumb { width: 55px; height: 55px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 1px solid #555; background: #2b2c36; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #888; flex-shrink: 0; text-align: center; transition: transform 0.2s; }
        .form-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .form-name { font-weight: bold; font-size: 15px; color: white; }
        .form-date { font-size: 12px; color: #aaa; }
        .form-status { font-size: 11px; font-weight: bold; padding: 3px 6px; border-radius: 4px; display: inline-block; width: fit-content; }
        .status-ok  { background: rgba(40,167,69,0.2);  color: var(--btn-green); border: 1px solid var(--btn-green); }
        .status-warn{ background: rgba(255,193,7,0.2);  color: #ffc107;          border: 1px solid #ffc107; }
        .status-exp { background: rgba(255,77,77,0.2);  color: var(--btn-red);   border: 1px solid var(--btn-red); }
        .btn-add-small { background: #444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
        .btn-add-small:hover { background: #555; }
        .btn-add-small svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-del-small { background: transparent; color: var(--btn-red); border: none; cursor: pointer; flex-shrink: 0; padding: 5px; display: flex; border-radius: 50%; outline: none; }
        .btn-del-small svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .img-upload-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: #323443; border: 1px dashed #888; color: #ccc; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: 0.2s; }
        .img-upload-btn svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .img-preview { width: 100%; max-height: 150px; object-fit: contain; border-radius: 8px; margin-top: 10px; display: none; border: 1px solid #555; }

        /* Sécurité / Support */
        .btn-update-pwd { background: var(--btn-blue); color: white; border: none; padding: 12px 15px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; transition: 0.2s; width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px; }
        .btn-update-pwd svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .btn-update-pwd:hover { opacity: 0.9; transform: translateY(-1px); }
        .pwd-group { margin-bottom: 15px; }
        .pwd-group label { display: block; color: #aaa; margin-bottom: 8px; font-size: 13px; font-weight: bold; }
        .pwd-group input { width: 100%; padding: 12px 15px; background: #1a1b23; border: 1px solid #444; color: white; border-radius: 8px; font-size: 15px; outline: none; transition: 0.2s; box-sizing: border-box; }
        .pwd-group input:focus { border-color: var(--btn-blue); }

        /* Modals */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 4000; justify-content: center; align-items: center; padding: env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px); box-sizing: border-box; }
        .modal-overlay.open { display: flex; }
        .modal-card-basic { background: var(--bg-panel); width: 90%; max-width: 400px; padding: 25px; border-radius: 15px; text-align: center; border: 1px solid #555; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto; }
        .modal-actions { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }
        .btn-modal-gray  { background: #444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
        .btn-modal-yellow{ background: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; }
        .btn-modal-green { background: var(--btn-green); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; }

        @media (min-width: 769px) and (max-width: 1100px) {
            .profil-main { padding: 20px; }
            .profil-top { grid-template-columns: 240px 1fr; }
            .modal-card-basic { max-width: 500px; }
        }
        @media (max-width: 768px) {
            .profil-main { padding: 15px; }
            .dash-header { flex-wrap: wrap; gap: 10px; }
            .dash-title { padding-right: 80px; width: 100%; }
            .btn-logout-header { width: 42px; height: 42px; justify-content: center; padding: 0; border-radius: 50%; background: var(--btn-red); border-color: var(--btn-red); }
            .btn-logout-header span { display: none; }
            .profil-top { grid-template-columns: 1fr; }
            .profile-card { flex-direction: row; flex-wrap: wrap; justify-content: center; padding: 20px; border-radius: 15px; }
            .stats-grid { max-width: 260px; }
            .settings-grid { grid-template-columns: 1fr; }
            .form-row { flex-direction: column; gap: 0; }
            .info-actions { flex-direction: row; }
        }
    </style>

    <div class="profil-main">

        <!-- ── Header ── -->
        <div class="dash-header">
            <div class="dash-title">
                <h1>Mon Profil</h1>
                <p>Compte personnel et certifications</p>
            </div>
            <button class="btn-logout-header" id="btnLogout">
                <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Déconnexion</span>
            </button>
        </div>

        <!-- ── Top : carte profil + formulaire info ── -->
        <div class="profil-top">

            <!-- Carte profil -->
            <div class="profile-card">
                <div class="avatar-circle" id="avatarCircle">??</div>
                <div class="profile-name" id="profileDisplayName">—</div>
                <div class="role-badge" id="roleBadge">Employé</div>
                <div class="stats-grid">
                    <div class="stat-box">
                        <span class="stat-num" id="statFeuilles">—</span>
                        <span class="stat-label">Feuilles</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-num" id="statFactures">—</span>
                        <span class="stat-label">Factures</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-num" id="statCertifs">—</span>
                        <span class="stat-label">Certifs</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-num" id="statAns">—</span>
                        <span class="stat-label">Ans</span>
                    </div>
                </div>
            </div>

            <!-- Formulaire informations personnelles -->
            <div class="info-card">
                <div class="info-header">
                    <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Informations personnelles
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Prénom</label>
                        <input type="text" id="profPrenom" placeholder="Ex: Frédéric">
                    </div>
                    <div class="form-group">
                        <label>Nom</label>
                        <input type="text" id="profNom" placeholder="Ex: Dussault">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Courriel</label>
                        <input type="email" id="profEmail" placeholder="Ex: fred@fdussault.ca">
                    </div>
                    <div class="form-group">
                        <label>Téléphone</label>
                        <input type="text" id="profPhone" placeholder="Ex: 819-478-5512">
                    </div>
                </div>
                <div class="form-group">
                    <label>Adresse</label>
                    <input type="text" id="profAdresse" placeholder="Ex: 1245, rue des Forges, Trois-Rivières, QC">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Numéro CCQ</label>
                        <input type="text" id="profCCQ" placeholder="Ex: CCQ-44829-77">
                    </div>
                    <div class="form-group">
                        <label>Métier</label>
                        <select id="profMetier">
                            <option value="">— Sélectionner —</option>
                            <option value="Plombier — Apprenti">Plombier — Apprenti</option>
                            <option value="Plombier — Compagnon">Plombier — Compagnon</option>
                            <option value="Plombier — Maître">Plombier — Maître</option>
                            <option value="Tuyauteur — Apprenti">Tuyauteur — Apprenti</option>
                            <option value="Tuyauteur — Compagnon">Tuyauteur — Compagnon</option>
                            <option value="Tuyauteur — Maître">Tuyauteur — Maître</option>
                            <option value="Électricien — Apprenti">Électricien — Apprenti</option>
                            <option value="Électricien — Compagnon">Électricien — Compagnon</option>
                            <option value="Électricien — Maître">Électricien — Maître</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                </div>
                <div class="info-actions">
                    <button class="btn-cancel-info" id="btnCancelInfo">Annuler</button>
                    <button class="btn-save-info" id="btnSaveInfo">Enregistrer</button>
                </div>
            </div>
        </div>

        <!-- ── Bas : signature + certifs + sécurité + support ── -->
        <div class="settings-grid">

            <!-- Signature -->
            <div class="settings-card" style="border-color:#9b59b6">
                <div class="card-header" style="color:#9b59b6">
                    <div class="card-header-left">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Ma Signature Officielle
                    </div>
                </div>
                <p style="color:#aaa;font-size:13px;margin-top:0;margin-bottom:15px">Dessinez votre signature. Elle sera apposée au bas de vos documents générés.</p>
                <div class="signature-container" style="border-color:#9b59b6">
                    <canvas id="sig-canvas"></canvas>
                </div>
                <div class="sig-actions">
                    <button class="btn-clear-sig" id="btnClearSig">Effacer et recommencer</button>
                    <button class="btn-save-sig" id="btnSaveSig">Sauvegarder</button>
                </div>
            </div>

            <!-- Certifications -->
            <div class="settings-card" style="border-color:var(--btn-green)">
                <div class="card-header" style="color:var(--btn-green)">
                    <div class="card-header-left">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                        Mes Certifications
                    </div>
                    <button class="btn-add-small" id="btnAddFormation">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Ajouter
                    </button>
                </div>
                <p style="color:#aaa;font-size:13px;margin-top:0;margin-bottom:15px">Vos cartes s'afficheront dans le calendrier lors de leur expiration.</p>
                <div class="formation-list" id="formationList"></div>
            </div>

            <!-- Sécurité + Support empilés -->
            <div style="display:flex;flex-direction:column;gap:20px">
                <div class="settings-card" style="border-color:var(--btn-blue)">
                    <div class="card-header" style="color:var(--btn-blue);border-bottom:none;margin-bottom:0">
                        <div class="card-header-left">
                            <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            Sécurité du compte
                        </div>
                    </div>
                    <div class="pwd-group" style="margin-top:15px">
                        <label>Ancien mot de passe</label>
                        <input type="password" id="oldPassword" placeholder="Mot de passe actuel">
                    </div>
                    <div class="pwd-group" style="margin-bottom:15px">
                        <label>Nouveau mot de passe</label>
                        <input type="password" id="newPassword" placeholder="Nouveau (min. 6 car.)">
                    </div>
                    <button class="btn-update-pwd" id="btnUpdatePwd">
                        <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Mettre à jour mon mot de passe
                    </button>
                </div>

                <div class="settings-card" style="border-color:var(--btn-orange)">
                    <div class="card-header" style="color:var(--btn-orange);border-bottom:none;margin-bottom:0">
                        <div class="card-header-left">
                            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>
                            Support Technique
                        </div>
                    </div>
                    <p style="color:#aaa;font-size:13px;margin-top:10px;margin-bottom:15px">Un bug ? Une suggestion ? Envoyez un message direct au développeur.</p>
                    <button class="btn-update-pwd" id="btnOpenTicket" style="background:var(--btn-orange);color:black">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Signaler un problème
                    </button>
                </div>
            </div>

        </div>
    </div>

    <!-- Modal formation -->
    <div class="modal-overlay" id="formationModal">
        <div class="modal-card-basic" style="text-align:left">
            <div style="font-size:20px;color:var(--btn-green);font-weight:bold;margin-bottom:20px;display:flex;align-items:center;gap:8px">
                <svg width="20" height="20" style="stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                Nouvelle Carte
            </div>
            <div class="form-group">
                <label>Nom (Ex: ASP Construction...)</label>
                <input type="text" id="inpFormName">
            </div>
            <div class="form-group">
                <label>Date d'expiration</label>
                <input type="date" id="inpFormDate">
            </div>
            <div class="form-group">
                <label>Photo de la carte (Optionnel)</label>
                <label class="img-upload-btn" for="inpFormImage">
                    <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Photographier / Choisir...
                </label>
                <input type="file" id="inpFormImage" accept="image/*" style="display:none">
                <img id="formImagePreview" class="img-preview" src="">
            </div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCancelFormation">Annuler</button>
                <button class="btn-modal-green" style="flex:1" id="btnSaveFormation">Enregistrer</button>
            </div>
        </div>
    </div>

    <!-- Modal image viewer -->
    <div class="modal-overlay" id="imageViewerModal">
        <div style="max-width:90%;max-height:90%">
            <img id="fullSizeImage" src="" style="max-width:100%;max-height:80vh;border-radius:12px;border:2px solid #555">
            <div style="margin-top:15px;text-align:center">
                <button class="btn-modal-gray" id="btnCloseViewer">Fermer</button>
            </div>
        </div>
    </div>

    <!-- Modal ticket -->
    <div class="modal-overlay" id="ticketModal">
        <div class="modal-card-basic">
            <div style="font-size:20px;color:var(--btn-orange);font-weight:bold;margin-bottom:15px">Signaler un problème</div>
            <p style="color:#ccc;font-size:13px;margin-bottom:15px;line-height:1.4">Décrivez précisément le bug rencontré ou votre suggestion.</p>
            <div class="form-group">
                <textarea id="ticketMessage" placeholder="Expliquez le problème ici..." style="width:100%;height:120px;background:#1e1f26;border:1px solid #555;color:white;padding:10px;border-radius:8px;font-family:sans-serif;outline:none;resize:none;box-sizing:border-box"></textarea>
            </div>
            <div class="modal-actions">
                <button class="btn-modal-gray" id="btnCancelTicket">Annuler</button>
                <button class="btn-modal-yellow" style="flex:1;background:var(--btn-orange)" id="btnSendTicket">Envoyer</button>
            </div>
        </div>
    </div>

    <!-- Modal alerte -->
    <div class="modal-overlay" id="alertModal">
        <div class="modal-card-basic">
            <div style="font-size:20px;color:var(--accent);font-weight:bold;margin-bottom:15px">Information</div>
            <div style="color:#e0e0e0;margin-bottom:25px;line-height:1.4" id="alertMsg"></div>
            <div class="modal-actions">
                <button class="btn-modal-yellow" id="btnCloseAlert">Compris</button>
            </div>
        </div>
    </div>
    `

    return await init()
}

// ── Init ────────────────────────────────────────────────────────────────────
async function init() {
    canvas = document.getElementById('sig-canvas')
    ctx = canvas.getContext('2d')
    drawing = false
    signatureHasData = false
    const cleanupCanvas = initCanvas()

    document.getElementById('btnLogout').addEventListener('click', logout)
    document.getElementById('btnSaveInfo').addEventListener('click', saveInfoForm)
    document.getElementById('btnCancelInfo').addEventListener('click', resetInfoForm)
    document.getElementById('btnSaveSig').addEventListener('click', saveSignature)
    document.getElementById('btnClearSig').addEventListener('click', clearSignature)

    document.getElementById('btnAddFormation').addEventListener('click', openFormationModal)
    document.getElementById('btnCancelFormation').addEventListener('click', () => closeModal('formationModal'))
    document.getElementById('btnSaveFormation').addEventListener('click', saveFormation)
    document.getElementById('inpFormImage').addEventListener('change', handleImageUpload)
    document.getElementById('btnCloseViewer').addEventListener('click', () => closeModal('imageViewerModal'))

    document.getElementById('btnOpenTicket').addEventListener('click', () => {
        document.getElementById('ticketMessage').value = ''
        document.getElementById('ticketModal').classList.add('open')
    })
    document.getElementById('btnCancelTicket').addEventListener('click', () => closeModal('ticketModal'))
    document.getElementById('btnSendTicket').addEventListener('click', envoyerTicket)
    document.getElementById('btnUpdatePwd').addEventListener('click', updateMyPassword)
    document.getElementById('btnCloseAlert').addEventListener('click', () => closeModal('alertModal'))

    await initProfileData()
    return cleanupCanvas
}

// ── Canvas signature ────────────────────────────────────────────────────────
function initCanvas() {
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        canvas.width = canvas.offsetWidth * ratio
        canvas.height = canvas.offsetHeight * ratio
        ctx.scale(ratio, ratio)
        ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#000'
    }
    const onMouseMove = e => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke() }
    const onMouseUp = () => { drawing = false }
    setTimeout(resizeCanvas, 100)
    window.addEventListener('resize', resizeCanvas)
    function getPos(e) {
        const rect = canvas.getBoundingClientRect()
        return {
            x: (e.touches ? e.touches[0].clientX : e.clientX) - rect.left,
            y: (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
        }
    }
    canvas.addEventListener('mousedown', e => { drawing = true; signatureHasData = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y) })
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('touchstart', e => { drawing = true; signatureHasData = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); e.preventDefault() }, { passive: false })
    canvas.addEventListener('touchmove', e => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault() }, { passive: false })
    canvas.addEventListener('touchend', () => { drawing = false })
    return function cleanup() {
        window.removeEventListener('resize', resizeCanvas)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
    }
}

function clearSignature() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    signatureHasData = false
}

// ── Chargement des données ──────────────────────────────────────────────────
async function initProfileData() {
    if (!currentUser) return
    try {
        const { data: profil } = await supabase
            .from('profils')
            .select('prenom, nom, prenom_nom, telephone, courriel, signature_base64, adresse, numero_ccq, metier, role')
            .eq('id', currentUser.id)
            .maybeSingle()

        if (profil) {
            // Remplir champs info
            const prenom = profil.prenom || (profil.prenom_nom || '').split(' ')[0] || ''
            const nom    = profil.nom    || (profil.prenom_nom || '').split(' ').slice(1).join(' ') || ''
            document.getElementById('profPrenom').value  = prenom
            document.getElementById('profNom').value     = nom
            document.getElementById('profPhone').value   = profil.telephone || ''
            document.getElementById('profEmail').value   = profil.courriel  || ''
            document.getElementById('profAdresse').value = profil.adresse   || ''
            document.getElementById('profCCQ').value     = profil.numero_ccq || ''
            if (profil.metier) document.getElementById('profMetier').value = profil.metier

            // Stocker pour le bouton Annuler
            loadedValues = { prenom, nom, telephone: profil.telephone || '', courriel: profil.courriel || '', adresse: profil.adresse || '', numero_ccq: profil.numero_ccq || '', metier: profil.metier || '' }

            // Carte profil
            const fullName = [prenom, nom].filter(Boolean).join(' ') || profil.prenom_nom || currentUser.email
            updateProfileCard(fullName, profil.role || currentRole)

            // Signature
            if (profil.signature_base64) {
                const img = new Image()
                img.onload = () => { ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight); signatureHasData = true }
                img.src = profil.signature_base64
            }
        }

        // Certifications
        const { data: formData } = await supabase
            .from('formations')
            .select('id,nom,date_expiration,image_base64')
            .eq('user_id', currentUser.id)
            .order('date_expiration', { ascending: true })
        formations = (formData || []).map(f => ({ id: f.id, name: f.nom, dateExp: f.date_expiration, image: f.image_base64 }))
        renderFormations()
        updateStatCertifs()

        // Stats
        loadStats()

    } catch (e) {
        console.error('Erreur chargement profil:', e)
    }
}

function updateProfileCard(fullName, role) {
    const parts = (fullName || '').trim().split(' ').filter(Boolean)
    const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (parts[0]?.[0] || '?').toUpperCase()

    const el = document.getElementById('avatarCircle')
    const nameEl = document.getElementById('profileDisplayName')
    const badge = document.getElementById('roleBadge')
    if (el) el.textContent = initials
    if (nameEl) nameEl.textContent = fullName || '—'
    if (badge) {
        const r = (role || '').toLowerCase()
        badge.textContent = r.includes('admin') ? 'Administrateur' : r.includes('employe') || r.includes('employé') ? 'Employé' : (role || 'Employé')
        badge.style.background = r.includes('admin') ? 'var(--accent)' : '#444'
        badge.style.color = r.includes('admin') ? 'black' : 'white'
    }
}

async function loadStats() {
    // Feuilles de temps
    try {
        const { count: feuilles } = await supabase
            .from('feuilles_de_temps')
            .select('id', { count: 'exact', head: true })
            .eq('author_id', currentUser.id)
        const el = document.getElementById('statFeuilles')
        if (el) el.textContent = feuilles ?? 0
    } catch { document.getElementById('statFeuilles').textContent = 0 }

    // Factures (globales — pas de champ user)
    try {
        const { count: factures } = await supabase
            .from('factures')
            .select('id', { count: 'exact', head: true })
        const el = document.getElementById('statFactures')
        if (el) el.textContent = factures ?? 0
    } catch { document.getElementById('statFactures').textContent = 0 }

    // Ans — calculé depuis created_at du compte
    try {
        const createdAt = new Date(currentUser.created_at)
        const ans = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365))
        const el = document.getElementById('statAns')
        if (el) el.textContent = ans < 1 ? '< 1' : ans
    } catch { document.getElementById('statAns').textContent = 0 }
}

function updateStatCertifs() {
    const el = document.getElementById('statCertifs')
    if (el) el.textContent = formations.length
}

// ── Sauvegarde info personnelle ─────────────────────────────────────────────
async function saveInfoForm() {
    const btn = document.getElementById('btnSaveInfo')
    btn.disabled = true; btn.textContent = 'Enregistrement...'
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
        updateProfileCard(prenom_nom, currentRole)
        showToast('✅ Informations sauvegardées !')
    } catch (e) {
        showAlert('❌ Erreur : ' + (e.message || friendlyError(e)))
    } finally {
        btn.disabled = false; btn.textContent = 'Enregistrer'
    }
}

function resetInfoForm() {
    document.getElementById('profPrenom').value  = loadedValues.prenom     || ''
    document.getElementById('profNom').value     = loadedValues.nom        || ''
    document.getElementById('profPhone').value   = loadedValues.telephone  || ''
    document.getElementById('profEmail').value   = loadedValues.courriel   || ''
    document.getElementById('profAdresse').value = loadedValues.adresse    || ''
    document.getElementById('profCCQ').value     = loadedValues.numero_ccq || ''
    document.getElementById('profMetier').value  = loadedValues.metier     || ''
}

// ── Sauvegarde signature ────────────────────────────────────────────────────
async function saveSignature() {
    const btn = document.getElementById('btnSaveSig')
    btn.disabled = true; btn.textContent = 'Sauvegarde...'
    try {
        const { error } = await supabase.from('profils').update({
            signature_base64: signatureHasData ? canvas.toDataURL() : null
        }).eq('id', currentUser.id)
        if (error) throw error
        showToast('✅ Signature sauvegardée !')
    } catch (e) {
        showAlert('❌ Erreur : ' + e.message)
    } finally {
        btn.disabled = false; btn.textContent = 'Sauvegarder'
    }
}

// ── Mot de passe ────────────────────────────────────────────────────────────
async function updateMyPassword() {
    const oldPwd = document.getElementById('oldPassword').value
    const newPwd = document.getElementById('newPassword').value
    if (!oldPwd || !newPwd) return showAlert('Veuillez remplir les deux champs.')
    if (newPwd.length < 6) return showAlert('Le nouveau mot de passe doit contenir au moins 6 caractères.')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: oldPwd })
    if (signInError) return showAlert("L'ancien mot de passe est incorrect.")
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) { showAlert(friendlyError(error)); return }
    document.getElementById('oldPassword').value = ''
    document.getElementById('newPassword').value = ''
    showAlert('✅ Mot de passe mis à jour avec succès !')
}

// ── Formations ──────────────────────────────────────────────────────────────
function renderFormations() {
    const list = document.getElementById('formationList')
    if (!list) return
    list.innerHTML = ''
    if (formations.length === 0) {
        list.innerHTML = '<div style="color:#888;font-style:italic;font-size:13px;text-align:center;padding:20px">Aucune carte ou certification enregistrée.</div>'
        return
    }
    formations.sort((a, b) => new Date(a.dateExp) - new Date(b.dateExp))
    formations.forEach(f => {
        const today = new Date()
        const expDate = new Date(f.dateExp)
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
        let statusClass = 'status-ok', statusText = 'Valide'
        if (diffDays < 0) { statusClass = 'status-exp'; statusText = 'Expiré' }
        else if (diffDays <= 30) { statusClass = 'status-warn'; statusText = `Expire dans ${diffDays} j.` }
        const parts = f.dateExp.split('-')
        const dateFR = `${parts[2]}/${parts[1]}/${parts[0]}`
        const imgHTML = f.image
            ? `<img class="form-thumb" src="${f.image}" data-view-id="${f.id}">`
            : `<div class="form-thumb">Pas<br>de photo</div>`
        const item = document.createElement('div')
        item.className = 'formation-item'
        item.innerHTML = `
            ${imgHTML}
            <div class="form-info">
                <div class="form-name">${sanitize(f.name || '')}</div>
                <div class="form-date">Exp : ${sanitize(dateFR)}</div>
                <div class="form-status ${statusClass}">${sanitize(statusText)}</div>
            </div>
            <button class="btn-del-small" data-del-id="${f.id}">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>`
        list.appendChild(item)
    })
    list.querySelectorAll('[data-del-id]').forEach(btn => btn.addEventListener('click', () => deleteFormation(btn.dataset.delId)))
    list.querySelectorAll('[data-view-id]').forEach(img => img.addEventListener('click', () => viewFullImage(img.dataset.viewId)))
}

function openFormationModal() {
    document.getElementById('inpFormName').value = ''
    document.getElementById('inpFormDate').value = ''
    document.getElementById('inpFormImage').value = ''
    document.getElementById('formImagePreview').style.display = 'none'
    currentFormationImageBase64 = null
    document.getElementById('formationModal').classList.add('open')
}

function handleImageUpload(event) {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
        const img = new Image()
        img.onload = () => {
            const MAX = 800; let w = img.width, h = img.height
            if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX } }
            else { if (h > MAX) { w *= MAX / h; h = MAX } }
            const cvs = document.createElement('canvas')
            cvs.width = w; cvs.height = h
            cvs.getContext('2d').drawImage(img, 0, 0, w, h)
            currentFormationImageBase64 = cvs.toDataURL('image/jpeg', 0.7)
            const preview = document.getElementById('formImagePreview')
            preview.src = currentFormationImageBase64; preview.style.display = 'block'
        }
        img.src = e.target.result
    }
    reader.readAsDataURL(file)
}

async function saveFormation() {
    const name = document.getElementById('inpFormName').value.trim()
    const dateExp = document.getElementById('inpFormDate').value
    if (!name || !dateExp) { showAlert("Veuillez remplir le nom et la date d'expiration."); return }
    const { data, error } = await supabase.from('formations').insert([{
        user_id: currentUser.id, nom: name, date_expiration: dateExp, image_base64: currentFormationImageBase64
    }]).select().single()
    if (error) { showAlert(friendlyError(error)); return }
    formations.push({ id: data.id, name: data.nom, dateExp: data.date_expiration, image: data.image_base64 })
    renderFormations()
    updateStatCertifs()
    closeModal('formationModal')
    window.dispatchEvent(new CustomEvent('formations_updated'))
}

async function deleteFormation(id) {
    const { error } = await supabase.from('formations').delete().eq('id', id)
    if (error) { showAlert(friendlyError(error)); return }
    formations = formations.filter(f => f.id !== id)
    renderFormations()
    updateStatCertifs()
    window.dispatchEvent(new CustomEvent('formations_updated'))
}

function viewFullImage(id) {
    const f = formations.find(f => f.id === id)
    if (f?.image) {
        document.getElementById('fullSizeImage').src = f.image
        document.getElementById('imageViewerModal').classList.add('open')
    }
}

// ── Ticket support ──────────────────────────────────────────────────────────
async function envoyerTicket() {
    const msg = document.getElementById('ticketMessage').value.trim()
    if (!msg) { showAlert("Veuillez inscrire un message avant d'envoyer."); return }
    const { error } = await supabase.from('tickets_support').insert([{
        author_id: currentUser.id,
        author_nom: document.getElementById('profPrenom').value + ' ' + document.getElementById('profNom').value || 'Employé',
        message: msg,
        statut: 'ouvert'
    }])
    if (error) { showAlert(friendlyError(error)); return }
    document.getElementById('ticketMessage').value = ''
    closeModal('ticketModal')
    showAlert('✅ Message envoyé au bureau avec succès !')
}

// ── Utilitaires ─────────────────────────────────────────────────────────────
function showAlert(msg) {
    document.getElementById('alertMsg').textContent = msg
    document.getElementById('alertModal').classList.add('open')
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open')
}
