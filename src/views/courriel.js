// src/views/courriel.js
// Migré fidèlement depuis code_courriel/code_courriel.html

import { supabase } from '../supabase.js'
import { currentUser } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'

// ── État local ──────────────────────────────────────────────────────────────
let myUserEmail = ''
let emailsData = []
let currentFolder = 'inbox'
let currentEmailId = null
let confirmCallback = null
let refreshInterval = null

// ── Render principal ────────────────────────────────────────────────────────
export async function render(container) {
    container.innerHTML = `
    <style>
        .courriel-main { display: flex; flex-direction: column; height: 100%; padding: 20px 30px; gap: 15px; overflow: hidden; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
        .dash-title h1 { margin: 0; font-size: 28px; color: white; }
        .dash-title p { margin: 5px 0 0; color: #aaa; font-size: 14px; }
        .btn-compose { background-color: var(--accent); color: black; border: none; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .btn-compose:hover { background-color: var(--accent-hover); transform: translateY(-2px); }
        .btn-compose svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }

        .email-layout { display: flex; flex: 1; gap: 0; overflow: hidden; background: var(--bg-panel); border-radius: 15px; border: 1px solid var(--border); box-shadow: 0 5px 15px rgba(0,0,0,0.2); min-height: 0; position: relative; }
        .email-folders { width: 220px; background: #22232c; border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 20px 0; flex-shrink: 0; }
        .folder-item { padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; color: #aaa; cursor: pointer; transition: 0.2s; border-left: 4px solid transparent; font-weight: bold; font-size: 13px; }
        .folder-item:hover { background: var(--bg-panel); color: white; }
        .folder-item.active { background: var(--bg-panel); color: var(--accent); border-left-color: var(--accent); }
        .folder-item-left { display: flex; align-items: center; gap: 12px; }
        .folder-item svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .badge-unread { background: var(--btn-red); color: white; font-size: 11px; padding: 2px 6px; border-radius: 10px; font-weight: bold; }

        .email-list-col { width: 350px; border-right: 1px solid var(--border); display: flex; flex-direction: column; background: var(--bg-panel); flex-shrink: 0; overflow: hidden; }
        .email-toolbar { padding: 15px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input { width: 100%; background: var(--bg-dark); border: 1px solid var(--border); color: white; padding: 14px 15px 14px 45px; border-radius: 8px; font-size: 16px; outline: none; transition: 0.2s; box-sizing: border-box; }
        .search-box input:focus { border-color: var(--accent); }
        .search-icon { position: absolute; left: 15px; color: #888; pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .email-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .email-item { padding: 15px; border-bottom: 1px solid #333; cursor: pointer; transition: 0.2s; position: relative; border-left: 3px solid transparent; }
        .email-item:hover { background: #343542; }
        .email-item.active { background: #343542; border-left-color: var(--btn-blue); }
        .email-item.unread .email-subject, .email-item.unread .email-sender { font-weight: bold; color: white; }
        .email-item.unread::after { content: ''; position: absolute; top: 18px; right: 15px; width: 8px; height: 8px; background: var(--btn-blue); border-radius: 50%; }
        .email-sender { font-size: 14px; color: #ccc; margin-bottom: 5px; padding-right: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .email-subject { font-size: 13px; color: #aaa; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .email-preview-text { font-size: 12px; color: #777; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .email-date { font-size: 11px; color: #666; position: absolute; top: 15px; right: 15px; }

        .email-view-col { flex: 1; display: flex; flex-direction: column; background: var(--bg-dark); position: relative; overflow: hidden; }
        .empty-view { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; }
        .empty-view svg { width: 60px; height: 60px; margin-bottom: 15px; opacity: 0.5; stroke: currentColor; fill: none; stroke-width: 1; }
        .reading-pane { display: none; flex-direction: column; height: 100%; overflow: hidden; }
        .reading-toolbar { padding: 15px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; background: var(--bg-panel); flex-shrink: 0; }
        .reading-actions { display: flex; gap: 10px; margin-left: auto; }
        .btn-tool { background: transparent; border: 1px solid #444; color: #aaa; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .btn-tool:hover { background: #444; color: white; }
        .btn-tool svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        .reading-header { padding: 25px 30px; border-bottom: 1px solid #333; flex-shrink: 0; }
        .reading-subject { font-size: 22px; color: white; margin: 0 0 15px 0; }
        .reading-meta { display: flex; justify-content: space-between; align-items: center; }
        .reading-sender-info { display: flex; align-items: center; gap: 12px; }
        .sender-avatar { width: 40px; height: 40px; background: var(--btn-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 16px; }
        .sender-name { color: white; font-weight: bold; font-size: 15px; }
        .sender-email-addr { color: #888; font-size: 13px; }
        .reading-date { color: #888; font-size: 13px; }
        .reading-body { padding: 30px; flex: 1; overflow-y: auto; color: #ccc; line-height: 1.6; font-size: 15px; white-space: pre-wrap; }
        .reading-body a { color: var(--btn-blue); }
        .btn-mobile-back { display: flex; background: transparent; border: none; color: var(--accent); cursor: pointer; align-items: center; gap: 5px; font-weight: bold; padding: 0; margin-right: 15px; }
        .btn-mobile-back svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 5000; justify-content: center; align-items: center; padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); box-sizing: border-box; }
        .modal-overlay.open { display: flex; }
        .compose-card { background: var(--bg-panel); width: 90%; max-width: 600px; border-radius: 15px; border: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.5); }
        .compose-header { background: #22232c; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; }
        .compose-header h3 { margin: 0; color: white; font-size: 16px; }
        .btn-close { background: none; border: none; color: #888; font-size: 24px; cursor: pointer; line-height: 1; padding: 0; }
        .compose-body { padding: 20px; display: flex; flex-direction: column; gap: 15px; }
        .compose-field { display: flex; border-bottom: 1px solid #444; padding-bottom: 10px; align-items: center; }
        .compose-field label { width: 60px; color: #aaa; font-size: 14px; }
        .compose-field input { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 14px; }
        .compose-textarea { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 15px; min-height: 200px; resize: none; font-family: inherit; line-height: 1.5; margin-top: 10px; }
        .compose-footer { padding: 15px 20px; border-top: 1px solid #444; display: flex; justify-content: space-between; align-items: center; background: #22232c; }
        .btn-send { background: var(--btn-blue); color: white; border: none; padding: 10px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .btn-send:hover { background: #2980b9; }
        .btn-send svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }

        @media (min-width: 769px) and (max-width: 1024px) { .courriel-main { padding: 20px; } }
        @media (max-width: 900px) {
            .email-layout { flex-direction: column; gap: 0; }
            .email-folders { width: 100%; flex-direction: row; padding: 15px; border-right: none; border-bottom: 1px solid var(--border); background: var(--bg-panel); overflow-x: auto; -webkit-overflow-scrolling: touch; gap: 10px; scrollbar-width: none; }
            .email-folders::-webkit-scrollbar { display: none; }
            .folder-item { padding: 8px 16px; border-left: none !important; background: #1e1f26; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
            .folder-item.active { background: var(--accent); color: black; }
            .email-list-col { width: 100%; border-right: none; flex: 1; }
            .email-view-col { display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; }
            .show-reading .email-list-col { display: none; }
            .show-reading .email-folders { display: none; }
            .show-reading .email-view-col { display: flex; }
            .btn-compose { padding: 0; width: 44px; height: 44px; border-radius: 50%; justify-content: center; margin-right: 60px; flex-shrink: 0; }
            .btn-compose span { display: none; }
        }
    </style>

    <div class="courriel-main">
        <div class="dash-header">
            <div class="dash-title"><h1>Boîte Courriel</h1><p>Messagerie interne</p></div>
            <button class="btn-compose" id="btnCompose">
                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>Rédiger</span>
            </button>
        </div>

        <div class="email-layout" id="emailLayout">

            <div class="email-folders">
                <div class="folder-item active" data-folder="inbox">
                    <div class="folder-item-left">
                        <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
                        Réception
                    </div>
                    <span class="badge-unread" id="unreadCount" style="display:none">0</span>
                </div>
                <div class="folder-item" data-folder="sent">
                    <div class="folder-item-left">
                        <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Envoyés
                    </div>
                </div>
                <div class="folder-item" data-folder="trash">
                    <div class="folder-item-left">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Corbeille
                    </div>
                </div>
            </div>

            <div class="email-list-col">
                <div class="email-toolbar">
                    <div class="search-box">
                        <span class="search-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                        <input type="text" id="emailSearch" placeholder="Rechercher...">
                    </div>
                </div>
                <div class="email-list" id="emailList"></div>
            </div>

            <div class="email-view-col">
                <div class="empty-view" id="emptyView">
                    <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
                    <p>Sélectionnez un message</p>
                </div>
                <div class="reading-pane" id="readingPane">
                    <div class="reading-toolbar">
                        <button class="btn-mobile-back" id="btnMobileBack">
                            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                            Retour
                        </button>
                        <div class="reading-actions">
                            <button class="btn-tool" id="btnReply" title="Répondre">
                                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="btn-tool" id="btnDelete" title="Supprimer">
                                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="reading-header">
                        <h2 class="reading-subject" id="readSubject">Sujet</h2>
                        <div class="reading-meta">
                            <div class="reading-sender-info">
                                <div class="sender-avatar" id="readAvatar">?</div>
                                <div>
                                    <div class="sender-name" id="readSender">Nom</div>
                                    <div class="sender-email-addr" id="readEmailAddress">email</div>
                                </div>
                            </div>
                            <div class="reading-date" id="readDate">Date</div>
                        </div>
                    </div>
                    <div class="reading-body" id="readBody"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal composition -->
    <div class="modal-overlay" id="composeModal">
        <div class="compose-card">
            <div class="compose-header">
                <h3>Nouveau message</h3>
                <button class="btn-close" id="btnCloseCompose">&times;</button>
            </div>
            <div class="compose-body">
                <div class="compose-field">
                    <label>À :</label>
                    <input type="email" id="composeTo" placeholder="adresse@exemple.com">
                </div>
                <div class="compose-field">
                    <label>Sujet :</label>
                    <input type="text" id="composeSubject" placeholder="Objet">
                </div>
                <textarea class="compose-textarea" id="composeBody" placeholder="Votre message..."></textarea>
            </div>
            <div class="compose-footer">
                <div></div>
                <button class="btn-send" id="btnSendEmail">
                    Envoyer
                    <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
            </div>
        </div>
    </div>

    <!-- Modal confirmation -->
    <div class="modal-overlay" id="confirmModal">
        <div style="background:var(--bg-panel);width:90%;max-width:350px;padding:25px;border-radius:15px;text-align:center;border:1px solid var(--border);box-shadow:0 10px 25px rgba(0,0,0,0.5)">
            <div style="font-size:20px;color:var(--btn-red);font-weight:bold;margin-bottom:15px">Confirmation</div>
            <div style="color:#e0e0e0;margin-bottom:25px;line-height:1.4" id="confirmMsg">Êtes-vous sûr ?</div>
            <div style="display:flex;justify-content:center;gap:10px">
                <button style="background:#444;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold" id="btnCancelConfirm">Annuler</button>
                <button style="background:var(--btn-red);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold" id="btnYesConfirm">Supprimer</button>
            </div>
        </div>
    </div>
    `

    await init()

    // Retourner la fonction de cleanup pour arrêter le polling quand on quitte
    return cleanup
}

// ── Init ────────────────────────────────────────────────────────────────────
async function init() {
    if (!currentUser) return
    myUserEmail = currentUser.email.toLowerCase()

    // Dossiers
    document.querySelectorAll('.folder-item[data-folder]').forEach(item => {
        item.addEventListener('click', () => switchFolder(item.dataset.folder, item))
    })

    // Recherche
    document.getElementById('emailSearch').addEventListener('keyup', () => renderEmailList())

    // Compose
    document.getElementById('btnCompose').addEventListener('click', openComposeModal)
    document.getElementById('btnCloseCompose').addEventListener('click', closeComposeModal)
    document.getElementById('btnSendEmail').addEventListener('click', sendEmail)

    // Lecture
    document.getElementById('btnMobileBack').addEventListener('click', closeReadingPane)
    document.getElementById('btnReply').addEventListener('click', replyEmail)
    document.getElementById('btnDelete').addEventListener('click', deleteCurrentEmail)

    // Confirmation
    document.getElementById('btnCancelConfirm').addEventListener('click', closeConfirmModal)
    document.getElementById('btnYesConfirm').addEventListener('click', () => {
        if (confirmCallback) confirmCallback()
        closeConfirmModal()
    })

    await chargerCourriels()

    // Rafraîchissement toutes les 30 secondes
    refreshInterval = setInterval(chargerCourriels, 30000)
}

function cleanup() {
    if (refreshInterval) clearInterval(refreshInterval)
    refreshInterval = null
}

// ── Chargement courriels ────────────────────────────────────────────────────
async function chargerCourriels() {
    const { data, error } = await supabase
        .from('courriels')
        .select('*')
        .or(`destinataire.eq.${myUserEmail},expediteur.eq.${myUserEmail}`)
        .order('created_at', { ascending: false })

    if (error) { console.error('Erreur chargement courriels:', error); return }

    emailsData = (data || []).map(dbMail => {
        const folder = dbMail.folder ||
            (dbMail.expediteur?.toLowerCase() === myUserEmail ? 'sent' : 'inbox')
        const dateObj = new Date(dbMail.created_at)
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.getHours() + ':' + String(dateObj.getMinutes()).padStart(2, '0')
        return {
            id: dbMail.id, folder,
            // Champs internes
            sender: dbMail.expediteur || dbMail.from_address || '',
            emailAddress: dbMail.expediteur || dbMail.from_address || '',
            subject: dbMail.sujet || dbMail.subject || '(Sans objet)',
            body: dbMail.contenu || dbMail.body_text || '',
            date: dateStr, fullDate: dateStr,
            unread: !dbMail.est_lu && folder === 'inbox',
            // Champs étendus — prêts pour intégration email externe
            fromName: dbMail.from_name || '',           // Nom affiché de l'expéditeur
            bodyPlain: dbMail.body_text || dbMail.contenu || '', // Texte brut
            // bodyHtml: dbMail.body_html || null,       // HTML (affiché dans iframe sandboxée)
            threadId: dbMail.thread_id || null,         // Pour regrouper les conversations
            providerId: dbMail.provider_message_id || null, // ID chez Gmail/Outlook/IMAP
            provider: dbMail.provider || 'internal',    // 'internal' | 'gmail' | 'outlook' | 'imap'
            // attachments: dbMail.attachments || [],    // [{ name, size, url }]
            // cc: dbMail.cc || [],
            // replyTo: dbMail.reply_to || null,
        }
    })

    renderEmailList()
    updateUnreadCount()
}

// ── Rendu liste ─────────────────────────────────────────────────────────────
function renderEmailList() {
    const container = document.getElementById('emailList')
    if (!container) return
    container.innerHTML = ''

    const query = document.getElementById('emailSearch')?.value.toLowerCase() || ''
    const filtered = emailsData.filter(e =>
        e.folder === currentFolder &&
        (e.subject.toLowerCase().includes(query) || e.sender.toLowerCase().includes(query) || e.body.toLowerCase().includes(query))
    )

    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#888">Vide</div>'
        return
    }

    filtered.forEach(email => {
        const div = document.createElement('div')
        div.className = `email-item ${email.id === currentEmailId ? 'active' : ''} ${email.unread ? 'unread' : ''}`
        div.innerHTML = `
            <div class="email-sender">${sanitize(email.fromName || email.sender)}</div>
            <div class="email-subject">${sanitize(email.subject)}</div>
            <div class="email-preview-text">${sanitize((email.bodyPlain || email.body).substring(0, 50))}...</div>
            <div class="email-date">${sanitize(email.date)}</div>
        `
        div.addEventListener('click', () => openEmail(email.id))
        container.appendChild(div)
    })
}

// ── Rendu corps de courriel (texte brut + liens cliquables, sans innerHTML) ──
function renderEmailBody(el, text) {
    el.textContent = ''
    if (!text) return
    const urlRe = /(https?:\/\/[^\s]+)/g
    let last = 0, match
    while ((match = urlRe.exec(text)) !== null) {
        if (match.index > last) el.appendChild(document.createTextNode(text.slice(last, match.index)))
        try {
            const parsed = new URL(match[0])
            if (['https:', 'http:'].includes(parsed.protocol)) {
                const a = document.createElement('a')
                a.href = match[0]
                a.textContent = match[0]
                a.target = '_blank'
                a.rel = 'noopener noreferrer'
                el.appendChild(a)
            } else { el.appendChild(document.createTextNode(match[0])) }
        } catch { el.appendChild(document.createTextNode(match[0])) }
        last = match.index + match[0].length
    }
    if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)))
}

// ── Ouverture courriel ──────────────────────────────────────────────────────
async function openEmail(id) {
    currentEmailId = id
    const email = emailsData.find(e => e.id === id)
    if (!email) return

    if (email.unread && email.folder === 'inbox') {
        email.unread = false
        updateUnreadCount()
        await supabase.from('courriels').update({ est_lu: true }).eq('id', email.id)
    }

    renderEmailList()

    document.getElementById('readSubject').textContent = email.subject
    document.getElementById('readSender').textContent = email.fromName || email.sender
    document.getElementById('readEmailAddress').textContent = email.emailAddress
    document.getElementById('readDate').textContent = email.fullDate
    renderEmailBody(document.getElementById('readBody'), email.bodyPlain || email.body)
    document.getElementById('readAvatar').textContent = (email.fromName || email.sender).charAt(0).toUpperCase()

    document.getElementById('emptyView').style.display = 'none'
    document.getElementById('readingPane').style.display = 'flex'
    document.getElementById('emailLayout').classList.add('show-reading')
}

// ── Dossier ─────────────────────────────────────────────────────────────────
function switchFolder(folder, el) {
    currentFolder = folder
    document.querySelectorAll('.folder-item').forEach(f => f.classList.remove('active'))
    if (el) el.classList.add('active')
    closeReadingPane()
}

function closeReadingPane() {
    document.getElementById('emptyView').style.display = 'flex'
    document.getElementById('readingPane').style.display = 'none'
    document.getElementById('emailLayout').classList.remove('show-reading')
    currentEmailId = null
    renderEmailList()
}

// ── Envoi courriel ──────────────────────────────────────────────────────────
async function sendEmail() {
    const to = document.getElementById('composeTo').value.trim().toLowerCase()
    const subject = document.getElementById('composeSubject').value.trim()
    const body = document.getElementById('composeBody').value.trim()

    if (!to) { alert('Destinataire requis.'); return }

    const btn = document.getElementById('btnSendEmail')
    btn.disabled = true

    // Optimistic UI
    emailsData.unshift({
        id: Date.now(), folder: 'sent', sender: 'Moi',
        emailAddress: to, subject, body,
        date: "À l'instant", fullDate: "Aujourd'hui", unread: false
    })
    renderEmailList()
    closeComposeModal()

    const { error } = await supabase.from('courriels').insert([{
        expediteur: myUserEmail, destinataire: to,
        sujet: subject, contenu: body, est_lu: false
    }])

    if (error) { console.error('Erreur envoi:', error) }
    else { await chargerCourriels() }

    btn.disabled = false
}

// ── Suppression ─────────────────────────────────────────────────────────────
async function deleteCurrentEmail() {
    const email = emailsData.find(e => e.id === currentEmailId)
    if (!email) return

    if (email.folder === 'trash') {
        showConfirm('Supprimer définitivement ce courriel ?', async () => {
            const { error } = await supabase.from('courriels').delete().eq('id', currentEmailId)
            if (error) { console.error('Erreur suppression:', error); return }
            emailsData = emailsData.filter(e => e.id !== currentEmailId)
            closeReadingPane()
        })
    } else {
        email.folder = 'trash'
        closeReadingPane()
    }
}

function replyEmail() {
    const email = emailsData.find(e => e.id === currentEmailId)
    if (email) {
        document.getElementById('composeTo').value = email.emailAddress
        document.getElementById('composeSubject').value = 'Re: ' + email.subject
        document.getElementById('composeBody').value = ''
    }
    openComposeModal()
}

// ── Modales ─────────────────────────────────────────────────────────────────
function openComposeModal() {
    document.getElementById('composeModal').classList.add('open')
    document.getElementById('btnSendEmail').disabled = false
}

function closeComposeModal() {
    document.getElementById('composeModal').classList.remove('open')
}

function updateUnreadCount() {
    const count = emailsData.filter(e => e.folder === 'inbox' && e.unread).length
    const badge = document.getElementById('unreadCount')
    if (badge) {
        badge.style.display = count > 0 ? 'inline-block' : 'none'
        badge.textContent = count
    }
}

function showConfirm(msg, callback) {
    document.getElementById('confirmMsg').textContent = msg
    confirmCallback = callback
    document.getElementById('confirmModal').classList.add('open')
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('open')
    confirmCallback = null
}