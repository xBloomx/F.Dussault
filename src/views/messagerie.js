// src/views/messagerie.js

import { supabase } from '../supabase.js'
import { currentUser, currentProfil } from '../auth.js'
import { sanitize } from '../shared/sanitize.js'
import { friendlyError } from '../shared/errorMsg.js'
import { avatarColor as getAvatarColor } from '../shared/avatarColor.js'

function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '#'
    try { const p = new URL(url); if (!['https:','http:'].includes(p.protocol)) return '#'; return url }
    catch { return '#' }
}

// ── État local ───────────────────────────────────────────────────────────────
let myUserId = ''
let myUserName = 'Moi'
let hiddenChatIds = new Set()
let allEmployees = []
let selectedFiles = []
let currentChatId = null
let currentReactMsgId = null
let currentChatIdToDelete = null
let isCustomizing = false
let selectedCustomizeIndex = 0
let realtimeChannel = null
let _previewBlobUrls = []
let _longPressTimer = null
let _longPressStartXY = null
let _editingMsgId = null
let _currentlySwipedItem = null
let _swipeState = null
let _titleNotifPending = false
let _chatSearchTerm = ''
let _onClickMsgDoc = null
let currentFilter = 'tous'
let quickReactions = (() => { try { return JSON.parse(localStorage.getItem('dussault_quick_reacts')) || ['❤️','👍','😂','😮','😢','🙏'] } catch { return ['❤️','👍','😂','😮','😢','🙏'] } })()

const conversationsData = { 'global': { name: 'Équipe (Général)', isGroup: true, messages: [] } }

const SWIPE_THRESHOLD_OPEN = 40
const SWIPE_THRESHOLD_DELETE = 140
const SWIPE_MAX = 80
const LONG_PRESS_MS = 500

// ── Render principal ──────────────────────────────────────────────────────────
export async function render(container) {
    myUserId   = currentUser?.id || ''
    myUserName = currentProfil?.prenom_nom || currentUser?.email?.split('@')[0] || 'Moi'

    container.innerHTML = `
    <style>
        /* ── Base layout ── */
        .msg-main { background: var(--bg-dark); color: var(--text-main); height: 100%; display: flex; flex-direction: column; overflow: hidden; font-family: var(--font-sans); }
        #view-dashboard { padding: 20px 24px; height: 100%; overflow: hidden; display: flex; gap: 14px; }

        /* ── Sidebar ── */
        .chat-sidebar {
            width: 340px; background: var(--bg-dark,#1a1b22);
            border-radius: var(--r-xl,14px); display: flex; flex-direction: column;
            border: 1px solid var(--border); overflow: hidden; flex-shrink: 0;
        }
        .sidebar-header {
            padding: 18px 20px; border-bottom: none;
            display: flex; justify-content: space-between; align-items: center;
        }
        .sidebar-header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #fff; }
        .sidebar-header p  { margin: 3px 0 0; color: var(--text-faint); font-size: 12px; }
        .btn-new-chat {
            background: var(--brand-yellow); color: #1a1b22;
            border: none; width: 34px; height: 34px; border-radius: var(--r-lg,10px);
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            transition: all var(--t-base);
        }
        .btn-new-chat svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2.5; }
        .btn-new-chat:hover { transform: scale(1.1); background: var(--brand-yellow-hover); }
        .sidebar-header-text { flex: 1; min-width: 0; }
        .msg-mob-menu-btn { display: none; background: transparent; border: none; color: var(--text-faint); width: 38px; height: 38px; align-items: center; justify-content: center; cursor: pointer; border-radius: var(--r-md,8px); flex-shrink: 0; padding: 0; }
        .msg-mob-menu-btn:hover { color: #fff; background: var(--bg-panel-2); }
        .msg-mob-menu-btn svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2; }
        .msg-filter-tabs { display: flex; gap: 8px; padding: 10px 14px 12px; overflow-x: auto; flex-shrink: 0; scrollbar-width: none; border-bottom: none; }
        .msg-filter-tabs::-webkit-scrollbar { display: none; }
        .msg-tab { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; border: 1.5px solid var(--border); font-family: inherit; transition: all 0.15s; flex-shrink: 0; background: var(--bg-panel-2); color: var(--text-muted); }
        .msg-tab.active { background: #fff; color: #1a1b22; border-color: #fff; }
        .msg-tab-badge { background: var(--brand-yellow); color: #1a1b22; font-size: 10px; font-weight: 700; min-width: 16px; height: 16px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; padding: 0 4px; }
        .contact-item.has-unread { border-left-color: var(--brand-yellow) !important; }
        .contact-item.has-unread .contact-time { color: var(--brand-yellow) !important; font-weight: 600 !important; }
        .contact-item.has-unread .contact-name > span:first-child { font-weight: 700; color: #fff; }
        .contact-item.has-unread .contact-last-msg { color: var(--text-main); }

        .sidebar-search {
            padding: 8px 14px 10px; border-bottom: none;
            display: flex; gap: 10px; align-items: center; background: transparent;
        }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box input {
            width: 100%; background: var(--bg-panel,#24252e); border: 1px solid var(--border-faint,#25262e);
            color: #fff; padding: 10px 14px 10px 38px; border-radius: var(--r-lg,10px);
            font-size: 14px; outline: none; transition: border-color var(--t-base); font-family: inherit;
        }
        .search-box input:focus { border-color: var(--brand-yellow); }
        .search-icon { position: absolute; left: 12px; color: var(--text-faint); pointer-events: none; display: flex; align-items: center; }
        .search-icon svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; }

        /* ── Contact list ── */
        .contact-list { flex: 1; overflow-y: auto; padding: 8px; }
        .contact-last-msg-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .contact-unread { background: var(--brand-yellow); color: #1a1b22; font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 999px; display: flex; align-items: center; justify-content: center; padding: 0 5px; flex-shrink: 0; }
        /* Status en ligne */
        .status-online { display: flex; align-items: center; gap: 5px; color: var(--status-green,#22c55e); font-size: 11px; font-weight: 600; }
        .status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--status-green,#22c55e); flex-shrink: 0; }
        /* Header actions */
        .chat-header-actions { display: flex; align-items: center; gap: 2px; margin-left: auto; }
        .btn-header-action { background: transparent; border: none; color: var(--text-faint); width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: var(--r-md,8px); transition: all var(--t-base); }
        .btn-header-action:hover { color: var(--brand-yellow); background: var(--brand-yellow-dim); }
        .btn-header-action svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        /* Emoji btn */
        .btn-emoji { background: transparent; border: none; color: var(--text-faint); width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: color var(--t-base); padding: 0; flex-shrink: 0; }
        .btn-emoji:hover { color: var(--brand-yellow); }
        .btn-emoji svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .contact-wrapper {
            position: relative; overflow: hidden;
            border-radius: 12px; margin-bottom: 6px;
            background: var(--bg-panel,#24252e);
        }
        .delete-btn-bg {
            position: absolute; top: 0; right: 0; bottom: 0; width: 76px;
            display: flex; align-items: center; justify-content: center;
            color: #fff; z-index: 1; cursor: pointer; background: var(--status-red);
            opacity: 0; transition: opacity 0.2s;
        }
        .delete-btn-bg svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2; }
        .contact-item.swiped + .delete-btn-bg { opacity: 1; }
        .contact-item {
            display: flex; align-items: center; padding: 14px 16px;
            cursor: pointer; border-left: 4px solid transparent;
            background: var(--bg-panel,#24252e); position: relative; z-index: 2;
            transition: background var(--t-fast), transform 0.3s ease;
            user-select: none; -webkit-user-select: none; touch-action: pan-y;
        }
        .contact-item.swiping { transition: none; }
        .contact-item.swiped  { transform: translateX(-76px); }
        .contact-item:hover   { background: var(--bg-panel-2,#2b2c36); }
        .contact-item.active  { background: var(--bg-panel-2,#2b2c36); border-left-color: var(--brand-yellow); }
        .avatar-wrap { position: relative; flex-shrink: 0; margin-right: 14px; }
        .avatar {
            width: 48px; height: 48px; border-radius: 50%;
            background: var(--bg-panel-3,#34353f); color: #fff;
            display: flex; justify-content: center; align-items: center;
            font-weight: 700; font-size: 17px;
        }
        .avatar-group { background: var(--brand-yellow-dim); color: var(--brand-yellow); border-radius: var(--r-lg,10px); }
        .avatar-group svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2; }
        .contact-info { flex: 1; min-width: 0; }
        .contact-name { font-weight: 600; color: #fff; font-size: 15px; display: flex; justify-content: space-between; margin-bottom: 4px; pointer-events: none; }
        .contact-time { font-size: 10px; color: var(--text-faint); font-weight: 400; }
        .contact-last-msg { font-size: 13px; color: var(--text-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }

        /* ── Chat main ── */
        .chat-main {
            flex: 1; background: var(--bg-panel);
            border-radius: var(--r-xl,14px); display: flex; flex-direction: column;
            border: 1px solid var(--border); overflow: hidden; min-width: 0;
        }
        .chat-header {
            padding: 12px 18px; border-bottom: 1px solid var(--border);
            display: flex; align-items: center; background: var(--bg-panel-2); flex-shrink: 0;
        }
        .chat-header h2 { margin: 0; font-size: 16px; font-weight: 700; color: #fff; }
        .chat-header-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .chat-header-sub { font-size: 11px; color: var(--text-faint); margin-top: 1px; }
        .btn-back { display: none; background: transparent; border: none; color: var(--brand-yellow); cursor: pointer; padding-right: 12px; padding-left: 0; }
        .btn-back svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2.5; }

        /* ── Messages ── */
        .messages-container { flex: 1; overflow-y: auto; overflow-x: hidden; background: var(--bg-dark); }
        .messages-track { display: flex; flex-direction: column; gap: 18px; padding: 20px; will-change: transform; }
        .message-wrapper { display: flex; flex-direction: column; width: 100%; position: relative; }
        .message-wrapper.received { align-items: flex-start; }
        .message-wrapper.sent     { align-items: flex-end; }
        .msg-bubble-group { max-width: 75%; display: flex; flex-direction: column; }
        .sent .msg-bubble-group   { align-items: flex-end; }
        .msg-time-side { position: absolute; right: -70px; top: 50%; transform: translateY(-50%); font-size: 10px; color: var(--text-faint); white-space: nowrap; pointer-events: none; }
        .msg-date-sep {
            align-self: center; background: var(--bg-panel); color: var(--text-faint);
            font-size: 11px; padding: 3px 12px; border-radius: 999px; margin: 4px 0;
            border: 1px solid var(--border); user-select: none;
        }
        .message-sender { font-size: 11px; color: var(--text-faint); margin-bottom: 4px; margin-left: 4px; }
        .sent .message-sender { display: none; }
        .message-content-row { display: flex; align-items: center; gap: 8px; position: relative; }
        .sent .message-content-row { flex-direction: row-reverse; }
        .message-bubble {
            padding: 10px 14px; border-radius: 14px; font-size: 14px;
            line-height: 1.45; position: relative; box-shadow: var(--shadow-sm);
        }
        .received .message-bubble { background: var(--bg-panel-2); color: var(--text-main); border-top-left-radius: 3px; border: 1px solid var(--border); }
        .sent     .message-bubble { background: var(--brand-yellow); color: #1a1b22; border-top-right-radius: 3px; font-weight: 500; }
        .bubble-image { padding: 3px; overflow: hidden; line-height: 0; position: relative; }
        .bubble-image img { max-width: 100%; max-height: 280px; border-radius: 11px; cursor: pointer; transition: opacity var(--t-fast); }
        .bubble-file { padding: 10px 12px; display: flex; align-items: center; gap: 10px; text-decoration: none; min-width: 180px; position: relative; }
        .received .bubble-file { color: var(--text-main); }
        .sent     .bubble-file { color: #1a1b22; }
        .file-icon svg, .file-download-icon svg { width: 100%; height: 100%; stroke: currentColor; fill: none; stroke-width: 2; }
        .file-icon { width: 26px; height: 26px; }
        .file-download-icon { width: 16px; height: 16px; opacity: 0.7; }
        .file-meta { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .file-name { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }
        .file-size { font-size: 11px; opacity: 0.75; }
        .message-time { display: none; font-size: 10px; color: var(--text-faint); margin-top: 3px; }
        .sent .message-time { text-align: right; }
        .msg-react-btn { background: transparent; border: none; color: var(--text-faint); cursor: pointer; padding: 5px; border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity var(--t-fast); flex-shrink: 0; }
        .message-content-row:hover .msg-react-btn { opacity: 1; }
        .msg-react-btn svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; }
        .msg-reaction-badge { position: absolute; bottom: -12px; right: 12px; background: var(--bg-panel); border: 1px solid var(--border); border-radius: 999px; padding: 2px 7px; font-size: 14px; box-shadow: var(--shadow-sm); z-index: 5; cursor: pointer; user-select: none; }
        .received .msg-reaction-badge { right: auto; left: 12px; }
        .msg-read-status { font-size: 10px; color: var(--status-green); margin-top: 3px; text-align: right; display: flex; align-items: center; justify-content: flex-end; gap: 3px; }
        .msg-read-status svg { width: 11px; height: 11px; stroke: currentColor; fill: none; stroke-width: 2.5; }
        .msg-highlight { background: rgba(252,202,70,0.3); border-radius: 2px; }

        /* ── Reaction picker ── */
        .reaction-picker {
            position: fixed; background: var(--bg-panel-2); border: 1px solid var(--border);
            border-radius: var(--r-pill); padding: 8px 14px;
            display: none; gap: 10px; box-shadow: var(--shadow-md); z-index: 200; align-items: center;
        }
        .reaction-list { display: flex; gap: 10px; }
        .reaction-list span { cursor: pointer; font-size: 22px; transition: transform var(--t-fast); display: block; user-select: none; }
        .reaction-list span:hover { transform: scale(1.35) translateY(-2px); }
        .reaction-divider { width: 1px; background: var(--border-strong,#3d3e48); margin: 0 4px; align-self: stretch; }
        .react-tool-btn { background: transparent; border: none; cursor: pointer; transition: background var(--t-fast); display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; color: var(--text-muted); }
        .react-tool-btn svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; }
        .react-tool-btn:hover { background: var(--bg-panel-3); color: #fff; }

        /* ── Bottom sheet emoji ── */
        .bottom-sheet-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 6000; align-items: flex-end; justify-content: center; padding: env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px); box-sizing: border-box; }
        .bottom-sheet-card { background: var(--bg-panel); width: 100%; max-width: 500px; border-radius: var(--r-2xl,18px) var(--r-2xl,18px) 0 0; padding: 20px; box-shadow: 0 -10px 30px rgba(0,0,0,0.5); border-top: 1px solid var(--border); display: flex; flex-direction: column; animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .top-quick-reactions { display: flex; justify-content: space-between; align-items: center; background: var(--bg-sunken,#15161c); padding: 10px 14px; border-radius: var(--r-lg,10px); margin-bottom: 14px; border: 1px solid var(--border); }
        .top-react-slot { font-size: 24px; padding: 8px; border-radius: 50%; cursor: pointer; transition: all var(--t-base); display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: transparent; border: 2px solid transparent; user-select: none; }
        .top-react-slot:hover { background: var(--bg-panel-2); transform: scale(1.1); }
        .top-react-slot.active-slot { border-color: var(--brand-yellow); background: var(--brand-yellow-dim); transform: scale(1.1); }
        emoji-picker { --background: transparent; --border-color: transparent; --text-color: #fff; --category-icon-color: var(--text-faint); --category-icon-active-color: var(--brand-yellow); --indicator-color: var(--brand-yellow); --input-border-color: var(--border); width: 100%; height: 350px; }

        /* ── Input zone ── */
        .chat-input-container { border-top: 1px solid var(--border); background: var(--bg-panel); display: flex; flex-direction: column; position: relative; flex-shrink: 0; }
        .attach-menu-popup {
            position: absolute; bottom: 72px; left: 14px;
            background: var(--bg-panel-2); backdrop-filter: blur(10px);
            border: 1px solid var(--border); border-radius: var(--r-xl,14px);
            display: flex; flex-direction: column; overflow: hidden;
            box-shadow: var(--shadow-md); padding: 4px; width: 200px;
            transform: translateY(8px); opacity: 0; pointer-events: none;
            transition: all var(--t-base); z-index: 100;
        }
        .attach-menu-popup.show { transform: translateY(0); opacity: 1; pointer-events: auto; }
        .attach-option {
            background: transparent; border: none; color: #fff;
            padding: 11px 14px; text-align: left; font-size: 14px;
            display: flex; align-items: center; gap: 12px; cursor: pointer;
            border-radius: var(--r-lg,10px); transition: background var(--t-fast); font-family: inherit;
        }
        .attach-option:hover { background: var(--bg-panel-3); }
        .attach-icon { width: 20px; height: 20px; color: var(--brand-yellow); display: flex; align-items: center; justify-content: center; }
        .attach-icon svg { width: 100%; height: 100%; stroke: currentColor; fill: none; stroke-width: 2; }
        .chat-input-area { padding: 12px 16px; display: flex; align-items: center; gap: 10px; }
        .btn-attach { background: transparent; border: none; color: var(--text-faint); width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: color var(--t-base); padding: 0; flex-shrink: 0; }
        .btn-attach:hover, .btn-attach.active { color: var(--brand-yellow); }
        .btn-attach svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
        .message-input {
            flex: 1; background: var(--bg-sunken,#15161c); border: 1px solid var(--border);
            color: #fff; padding: 11px 18px; border-radius: 999px; font-size: 14px;
            outline: none; transition: border-color var(--t-base); min-width: 0; font-family: inherit;
        }
        .message-input:focus { border-color: var(--brand-yellow); }
        .btn-send-msg {
            background: var(--brand-yellow); color: #1a1b22; border: none;
            width: 40px; height: 40px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all var(--t-base); flex-shrink: 0;
        }
        .btn-send-msg svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2.5; margin-left: -2px; }
        .btn-send-msg:hover { background: var(--brand-yellow-hover); transform: scale(1.08); }

        /* ── Chat search ── */
        .btn-chat-search { background: transparent; border: none; color: var(--text-faint); width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: var(--r-md,8px); margin-left: auto; transition: all var(--t-base); }
        .btn-chat-search:hover, .btn-chat-search.active { color: var(--brand-yellow); background: var(--brand-yellow-dim); }
        .btn-chat-search svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
        #chatSearchBar { display: none; padding: 8px 14px; background: var(--bg-panel-2); border-bottom: 1px solid var(--border); align-items: center; gap: 10px; }
        #chatSearchBar.show { display: flex; }
        #chatSearchInput { flex: 1; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); color: #fff; padding: 9px 13px; border-radius: var(--r-lg,10px); font-size: 13px; outline: none; font-family: inherit; }
        #chatSearchInput:focus { border-color: var(--brand-yellow); }
        #chatSearchCount { color: var(--text-faint); font-size: 12px; white-space: nowrap; }
        .btn-close-chat-search { background: transparent; border: none; color: var(--text-faint); font-size: 20px; cursor: pointer; padding: 0; line-height: 1; }
        .btn-close-chat-search:hover { color: #fff; }

        /* ── Attachment preview ── */
        .attachment-preview { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 16px 0; }
        .attachment-preview:empty { display: none; }
        .preview-item { position: relative; }
        .preview-item img { width: 56px; height: 56px; object-fit: cover; border-radius: var(--r-md,8px); }
        .preview-item-file { background: var(--bg-panel-2); border: 1px solid var(--border); padding: 5px 10px; border-radius: var(--r-md,8px); font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 5px; }
        .remove-attachment { position: absolute; top: -5px; right: -5px; background: var(--status-red); color: #fff; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        /* ── Modals ── */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 5000; justify-content: center; align-items: center; padding: env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px); box-sizing: border-box; }
        .modal-overlay.open { display: flex; }

        /* New chat card */
        .new-chat-card { background: var(--bg-panel); width: 90%; max-width: 440px; border-radius: var(--r-xl,14px); border: 1px solid var(--border); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; max-height: 85vh; overflow: hidden; }
        .new-chat-header { padding: 18px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: var(--bg-panel-2); }
        .new-chat-header h3 { margin: 0; color: #fff; font-size: 16px; font-weight: 700; }
        .new-chat-body { padding: 16px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px; }
        #groupNameGroup { transition: max-height 0.3s ease, opacity 0.3s ease; max-height: 0; opacity: 0; overflow: hidden; }
        #groupNameGroup.show { max-height: 100px; opacity: 1; }
        .new-chat-input { width: 100%; padding: 10px 14px; background: var(--bg-sunken,#15161c); border: 1px solid var(--border); color: #fff; border-radius: var(--r-lg,10px); font-size: 14px; outline: none; box-sizing: border-box; transition: border-color var(--t-base); font-family: inherit; }
        .new-chat-input:focus { border-color: var(--brand-yellow); }
        .new-chat-label { display: block; color: var(--text-faint); margin-bottom: 7px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        #newChatUserList { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px; }
        .user-select-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; transition: all var(--t-base); border-radius: var(--r-lg,10px); border: 1px solid var(--border); background: var(--bg-sunken,#15161c); }
        .user-select-row:hover { background: var(--bg-panel-2); border-color: var(--border-strong,#3d3e48); }
        .user-select-row.selected { background: var(--brand-yellow-dim); border-color: rgba(252,202,70,0.4); }
        .user-select-row input[type="checkbox"] { display: none; }
        .user-info { display: flex; align-items: center; gap: 10px; flex: 1; }
        .user-select-name { font-size: 14px; color: #fff; font-weight: 600; }
        .custom-checkbox { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--border-strong,#3d3e48); display: block; transition: all var(--t-base); margin-left: auto; background: transparent; flex-shrink: 0; }
        .user-select-row.selected .custom-checkbox { background: var(--brand-yellow); border-color: var(--brand-yellow); }
        .new-chat-footer { padding: 16px 20px; border-top: 1px solid var(--border); background: var(--bg-panel); display: flex; gap: 10px; justify-content: flex-end; }
        .btn-modal-gray  { background: var(--bg-panel-2); color: var(--text-muted); border: 1px solid var(--border); padding: 10px 18px; border-radius: var(--r-lg,10px); cursor: pointer; font-weight: 600; font-size: 13px; font-family: inherit; transition: background var(--t-base); }
        .btn-modal-gray:hover  { background: var(--bg-panel-3); color: #fff; }
        .btn-modal-green { background: var(--status-green); color: #fff; border: none; padding: 10px 24px; border-radius: var(--r-lg,10px); cursor: pointer; font-weight: 700; font-size: 13px; font-family: inherit; transition: opacity var(--t-base); }
        .btn-modal-green:hover { opacity: 0.88; }
        .btn-modal-yellow { background: var(--brand-yellow); color: #1a1b22; border: none; padding: 11px 18px; border-radius: var(--r-lg,10px); cursor: pointer; font-weight: 700; font-size: 13px; width: 100%; font-family: inherit; }
        .btn-modal-red   { background: var(--status-red); color: #fff; border: none; padding: 10px 18px; border-radius: var(--r-lg,10px); cursor: pointer; font-weight: 700; font-size: 13px; font-family: inherit; }

        /* Basic modals */
        .modal-card-basic { background: var(--bg-panel); width: 90%; max-width: 380px; padding: 24px; border-radius: var(--r-xl,14px); text-align: center; border: 1px solid var(--border); box-shadow: var(--shadow-lg); }
        .modal-card-basic h3 { margin-top: 0; font-size: 17px; }

        /* ── Mobile responsive ── */
        @media (max-width: 900px) {
            #view-dashboard { padding: 12px; gap: 0; }
            .chat-sidebar { width: 100%; border-radius: var(--r-xl,14px); flex: 1; }
            .chat-main { display: none; width: 100%; border-radius: var(--r-xl,14px); flex: 1; }
            #view-dashboard.show-chat .chat-sidebar { display: none; }
            #view-dashboard.show-chat .chat-main    { display: flex; }
            .btn-back { display: flex; }
            .msg-bubble-group { max-width: 84%; }
            .msg-react-btn { opacity: 1; }
        }
        @media (max-width: 768px) {
            #view-dashboard { padding: 0; }
            .chat-sidebar, .chat-main { border-radius: 0; border-left: none; border-right: none; }
            .sidebar-header { display: flex; padding: 12px 14px; }
            .msg-mob-menu-btn { display: flex; }
            .message-time { display: block; }
            .msg-time-side { display: none; }
        }
    </style>

    <svg style="display:none">
        <symbol id="msg-users" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></symbol>
        <symbol id="msg-paperclip" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></symbol>
        <symbol id="msg-camera" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></symbol>
        <symbol id="msg-image" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></symbol>
        <symbol id="msg-file" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="13 2 13 9 20 9"/></symbol>
        <symbol id="msg-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></symbol>
        <symbol id="msg-back" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></symbol>
        <symbol id="msg-download" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></symbol>
        <symbol id="msg-smile" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none"/></symbol>
        <symbol id="msg-plus" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></symbol>
        <symbol id="msg-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></symbol>
        <symbol id="msg-trash" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></symbol>
        <symbol id="msg-send" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></symbol>
    </svg>

    <div class="msg-main">
        <div id="view-dashboard">
            <aside class="chat-sidebar">
                <div class="sidebar-header">
                    <button class="msg-mob-menu-btn" id="msgMenuBtn" aria-label="Menu">
                        <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                    </button>
                    <div class="sidebar-header-text">
                        <h1>Messagerie</h1>
                        <p id="sidebar-stats" style="margin:3px 0 0;color:var(--text-faint);font-size:12px"></p>
                    </div>
                    <button class="btn-new-chat" id="btnNewChat" title="Nouvelle discussion">
                        <svg viewBox="0 0 24 24"><use href="#msg-edit"/></svg>
                    </button>
                </div>
                <div class="sidebar-search">
                    <div class="search-box">
                        <span class="search-icon"><svg><use href="#msg-search"/></svg></span>
                        <input type="text" id="searchContactInput" placeholder="Rechercher une conversation…">
                    </div>
                </div>
                <div class="msg-filter-tabs" id="msgFilterTabs">
                    <button class="msg-tab active" data-filter="tous">Tous</button>
                    <button class="msg-tab" data-filter="equipe">Équipe <span class="msg-tab-badge" id="badge-equipe" style="display:none"></span></button>
                    <button class="msg-tab" data-filter="clients">Clients <span class="msg-tab-badge" id="badge-clients" style="display:none"></span></button>
                    <button class="msg-tab" data-filter="fournisseurs">Fournisseurs</button>
                </div>
                <div class="contact-list" id="contactListContainer"></div>
            </aside>

            <main class="chat-main">
                <header class="chat-header">
                    <button class="btn-back" id="btnBack"><svg><use href="#msg-back"/></svg></button>
                    <div id="chatHeaderAvatar" class="avatar" style="width:40px;height:40px;font-size:15px;margin-right:12px"></div>
                    <div class="chat-header-info">
                        <h2 id="chatHeaderName">Sélectionnez une discussion</h2>
                        <div class="chat-header-sub" id="chatHeaderSub"></div>
                    </div>
                    <div class="chat-header-actions">
                        <button class="btn-chat-search btn-header-action" id="btnChatSearch" title="Rechercher dans la conversation">
                            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </button>
                        <button class="btn-header-action" id="btnHeaderPhone" title="Appel">
                            <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.27 6.27l1.18-1.18a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </button>
                        <button class="btn-header-action" id="btnHeaderMenu" title="Plus d'options">
                            <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/></svg>
                        </button>
                    </div>
                </header>
                <div id="chatSearchBar">
                    <input type="text" id="chatSearchInput" placeholder="Rechercher dans la conversation…">
                    <span id="chatSearchCount"></span>
                    <button class="btn-close-chat-search" id="btnCloseChatSearch">×</button>
                </div>
                <div class="messages-container" id="chatMessages">
                    <div style="text-align:center;color:var(--text-faint);font-style:italic;margin-top:50px;font-size:13px">Aucune conversation sélectionnée.</div>
                </div>
                <div class="chat-input-container">
                    <div class="attach-menu-popup" id="attachMenu">
                        <button class="attach-option" id="attachCamera"><div class="attach-icon"><svg><use href="#msg-camera"/></svg></div> Appareil photo</button>
                        <button class="attach-option" id="attachGallery"><div class="attach-icon"><svg><use href="#msg-image"/></svg></div> Galerie photos</button>
                        <button class="attach-option" id="attachFile"><div class="attach-icon"><svg><use href="#msg-file"/></svg></div> Document</button>
                    </div>
                    <input type="file" id="inputCamera"  accept="image/*" capture="environment" hidden>
                    <input type="file" id="inputGallery" accept="image/*,video/*" multiple hidden>
                    <input type="file" id="inputFile"    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" multiple hidden>
                    <div class="attachment-preview" id="attachmentPreview"></div>
                    <div class="chat-input-area">
                        <button class="btn-attach" id="attachBtn"><svg><use href="#msg-paperclip"/></svg></button>
                        <input type="text" class="message-input" placeholder="Écris un message…" id="messageInput" autocomplete="off">
                        <button class="btn-emoji" id="btnEmoji" title="Emoji"><svg><use href="#msg-smile"/></svg></button>
                        <button class="btn-send-msg" id="btnSendMsg"><svg><use href="#msg-send"/></svg></button>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- Reaction picker -->
    <div id="reactionPicker" class="reaction-picker">
        <div id="quickReactionsList" class="reaction-list"></div>
        <div class="reaction-divider"></div>
        <button class="react-tool-btn" id="btnMoreEmoji" title="Plus d'emojis"><svg><use href="#msg-plus"/></svg></button>
    </div>

    <!-- Modal fullPicker emoji -->
    <div class="bottom-sheet-modal" id="fullPickerModal">
        <div class="bottom-sheet-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                <b style="color:#fff;font-size:15px">Réactions</b>
                <div style="display:flex;gap:14px;align-items:center">
                    <button id="btnToggleCustomize" style="background:none;border:none;color:var(--status-blue);font-weight:700;font-size:13px;cursor:pointer;padding:0">Personnaliser</button>
                    <button id="btnCloseFullPicker" style="background:none;border:none;color:var(--text-faint);font-size:22px;cursor:pointer;padding:0;line-height:1">×</button>
                </div>
            </div>
            <div id="topQuickReactions" class="top-quick-reactions"></div>
            <emoji-picker id="myEmojiPicker"></emoji-picker>
        </div>
    </div>

    <!-- Modal nouveau chat -->
    <div class="modal-overlay" id="newChatModal">
        <div class="new-chat-card">
            <div class="new-chat-header">
                <h3>Nouvelle discussion</h3>
                <button id="btnCloseNewChat" style="background:none;border:none;color:var(--text-faint);font-size:22px;cursor:pointer;line-height:1">×</button>
            </div>
            <div class="new-chat-body">
                <div id="groupNameGroup">
                    <label class="new-chat-label">Nom du groupe</label>
                    <input type="text" class="new-chat-input" id="newGroupName" placeholder="Ex: Chantier Montréal…">
                </div>
                <label class="new-chat-label">Sélectionner les participants</label>
                <div id="newChatUserList"></div>
            </div>
            <div class="new-chat-footer">
                <button class="btn-modal-gray" id="btnCancelNewChat">Annuler</button>
                <button class="btn-modal-green" id="btnCreateChat">Créer la discussion</button>
            </div>
        </div>
    </div>

    <!-- Modal confirmation masquer -->
    <div class="modal-overlay" id="confirmDeleteModal">
        <div class="modal-card-basic">
            <h3 style="color:var(--status-red)">Masquer la conversation</h3>
            <p style="color:var(--text-muted);font-size:14px;margin:16px 0;line-height:1.5">Cette conversation sera retirée de votre liste. Si un nouveau message arrive, elle réapparaîtra.</p>
            <div style="display:flex;gap:10px;justify-content:center">
                <button class="btn-modal-gray" style="flex:1" id="btnCancelDelete">Annuler</button>
                <button class="btn-modal-red"  style="flex:1" id="btnExecuteDelete">Masquer</button>
            </div>
        </div>
    </div>

    <!-- Modal alerte -->
    <div class="modal-overlay" id="alertModal">
        <div class="modal-card-basic">
            <h3 style="color:var(--brand-yellow)">Information</h3>
            <p id="alertMessage" style="color:var(--text-muted);font-size:14px;margin:16px 0;line-height:1.5"></p>
            <button class="btn-modal-yellow" id="btnCloseAlert">Compris</button>
        </div>
    </div>

    <!-- Modal confirmation action -->
    <div class="modal-overlay" id="confirmActionModal">
        <div class="modal-card-basic">
            <h3 style="color:var(--status-red)" id="confirmActionTitle">Confirmer</h3>
            <p style="color:var(--text-muted);font-size:14px;margin:16px 0;line-height:1.5" id="confirmActionMsg"></p>
            <div style="display:flex;gap:10px;justify-content:center">
                <button class="btn-modal-gray" style="flex:1" id="btnCancelAction">Annuler</button>
                <button class="btn-modal-red"  style="flex:1" id="btnConfirmAction">Oui</button>
            </div>
        </div>
    </div>
    `
    await init(container)
    return cleanup
}

// ── Init ────────────────────────────────────────────────────────────────────
async function init(container) {
    // Boutons
    container.querySelector('#btnNewChat').addEventListener('click', () => openNewChatModal(container))
    container.querySelector('#btnCloseNewChat').addEventListener('click', () => closeModal('newChatModal', container))
    container.querySelector('#btnCancelNewChat').addEventListener('click', () => closeModal('newChatModal', container))
    container.querySelector('#btnCreateChat').addEventListener('click', () => createNewChat(container))
    container.querySelector('#btnBack').addEventListener('click', () => closeChat(container))
    container.querySelector('#btnSendMsg').addEventListener('click', () => sendMessage(container))
    container.querySelector('#messageInput').addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(container) })
    container.querySelector('#btnCancelDelete').addEventListener('click', () => cancelDeleteChat(container))
    container.querySelector('#btnExecuteDelete').addEventListener('click', () => executeDeleteChat(container))
    container.querySelector('#btnCloseAlert').addEventListener('click', () => closeModal('alertModal', container))
    container.querySelector('#btnMoreEmoji').addEventListener('click', () => openFullPicker(container))
    container.querySelector('#btnEmoji')?.addEventListener('click', () => openFullPicker(container))
    container.querySelector('#btnToggleCustomize').addEventListener('click', toggleCustomizeMode)
    container.querySelector('#btnCloseFullPicker').addEventListener('click', () => closeModal('fullPickerModal', container))
    // emoji-picker-element — écouter la sélection d'un emoji
    const emojiPicker = container.querySelector('#myEmojiPicker')
    if (emojiPicker) {
        emojiPicker.addEventListener('emoji-click', e => {
            const emoji = e.detail.unicode
            if (isCustomizing) {
                quickReactions[selectedCustomizeIndex] = emoji
                selectedCustomizeIndex = (selectedCustomizeIndex + 1) % quickReactions.length
                renderTopQuickReactions(container)
            } else {
                selectReaction(emoji, container)
                closeModal('fullPickerModal', container)
            }
        })
    }
    container.querySelector('#btnCancelAction').addEventListener('click', () => closeModal('confirmActionModal', container))
    container.querySelector('#btnConfirmAction').addEventListener('click', () => {
        const cb = container._confirmCallback
        closeModal('confirmActionModal', container)
        if (cb) cb()
    })

    // Pièces jointes
    const attachBtn = container.querySelector('#attachBtn')
    const attachMenu = container.querySelector('#attachMenu')
    attachBtn.addEventListener('click', e => { e.stopPropagation(); attachMenu.classList.toggle('show'); attachBtn.classList.toggle('active') })
    container.querySelector('#attachCamera').addEventListener('click', () => { container.querySelector('#inputCamera').click(); attachMenu.classList.remove('show') })
    container.querySelector('#attachGallery').addEventListener('click', () => { container.querySelector('#inputGallery').click(); attachMenu.classList.remove('show') })
    container.querySelector('#attachFile').addEventListener('click', () => { container.querySelector('#inputFile').click(); attachMenu.classList.remove('show') })
    container.querySelector('#inputCamera').addEventListener('change', e => handleFileSelect(e, container))
    container.querySelector('#inputGallery').addEventListener('change', e => handleFileSelect(e, container))
    container.querySelector('#inputFile').addEventListener('change', e => handleFileSelect(e, container))
    _onClickMsgDoc = e => {
        if (!attachMenu.contains(e.target) && e.target !== attachBtn && !attachBtn.contains(e.target)) {
            attachMenu.classList.remove('show')
            if (selectedFiles.length === 0) attachBtn.classList.remove('active')
        }
        if (!document.getElementById('reactionPicker').contains(e.target)) {
            document.getElementById('reactionPicker').style.display = 'none'
        }
    }
    document.addEventListener('click', _onClickMsgDoc)

    // Recherche contacts
    container.querySelector('#searchContactInput').addEventListener('keyup', () => filterContacts(container))

    // Hamburger mobile → ouvre la sidebar de navigation
    container.querySelector('#msgMenuBtn')?.addEventListener('click', () => {
        document.getElementById('topbar-mobile-menu-btn')?.click()
    })

    // Onglets de filtre
    container.querySelectorAll('.msg-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter
            container.querySelectorAll('.msg-tab').forEach(t => t.classList.toggle('active', t === btn))
            renderContactList(container)
        })
    })

    // Recherche in-chat
    container.querySelector('#btnChatSearch').addEventListener('click', () => {
        const bar = container.querySelector('#chatSearchBar')
        const btn = container.querySelector('#btnChatSearch')
        const isOpen = bar.classList.contains('show')
        if (isOpen) { closeChatSearch(container) }
        else { bar.classList.add('show'); btn.classList.add('active'); container.querySelector('#chatSearchInput').focus() }
    })
    container.querySelector('#btnCloseChatSearch').addEventListener('click', () => closeChatSearch(container))
    container.querySelector('#chatSearchInput').addEventListener('input', e => {
        _chatSearchTerm = e.target.value.trim()
        if (currentChatId && conversationsData[currentChatId]) renderMessages(conversationsData[currentChatId].messages, false, container)
    })

    renderQuickReactions(container)
    await chargerChatsMasques()
    await chargerProfilsEmployes()
    renderContactList(container)
    await chargerMessagesSupabase(container)
    return cleanup
}

function cleanup() {
    _previewBlobUrls.forEach(u => URL.revokeObjectURL(u))
    _previewBlobUrls = []
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
        realtimeChannel = null
    }
    if (_onClickMsgDoc) { document.removeEventListener('click', _onClickMsgDoc); _onClickMsgDoc = null }
}

// ── Chargement ──────────────────────────────────────────────────────────────
async function chargerChatsMasques() {
    try {
        const { data } = await supabase.from('chats_caches').select('chat_id').eq('user_id', myUserId)
        hiddenChatIds = new Set((data || []).map(r => r.chat_id))
    } catch { hiddenChatIds = new Set() }
}

async function chargerProfilsEmployes() {
    const { data } = await supabase.from('profils').select('id, prenom_nom')
    if (data) {
        allEmployees = data.filter(p => p.id !== myUserId).map(p => {
            const nom = p.prenom_nom || 'Utilisateur'
            const parts = nom.split(' ')
            const initials = (parts[0][0] + (parts.length > 1 ? parts[1][0] : '')).toUpperCase()
            return { id: p.id, name: nom, initials }
        })
    }
}

async function chargerMessagesSupabase(container) {
    const { data, error } = await supabase.from('message')
        .select('id, created_at, contenu, expediteur_id, chat_id, edited_at, deleted_at, read_by, profils(prenom_nom)')
        .order('created_at', { ascending: true })

    if (error) { showAlert(friendlyError(error), container); return }

    Object.values(conversationsData).forEach(c => c.messages = [])

    data.forEach(msgDB => {
        const date = new Date(msgDB.created_at)
        const timeStr = date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0')
        const isMine = msgDB.expediteur_id === myUserId
        const senderName = msgDB.profils?.prenom_nom || 'Inconnu'
        const decodage = decoderMessage(msgDB.contenu)
        const cId = msgDB.chat_id || 'global'

        if (!conversationsData[cId]) {
            const uuids = cId.split('_')
            const otherId = uuids[0] === myUserId ? uuids[1] : uuids[0]
            const otherEmp = allEmployees.find(e => e.id === otherId)
            conversationsData[cId] = { name: otherEmp ? otherEmp.name : (isMine ? 'Conversation Privée' : senderName), isGroup: cId === 'global', messages: [] }
        }

        conversationsData[cId].messages.push({
            id: msgDB.id, sender: senderName, time: timeStr, isMine,
            reaction: msgDB.reaction || null,
            type: decodage.type, text: decodage.text, url: decodage.url,
            fileName: decodage.fileName, fileSize: decodage.fileSize,
            createdAt: msgDB.created_at, editedAt: msgDB.edited_at, deletedAt: msgDB.deleted_at,
            readBy: Array.isArray(msgDB.read_by) ? msgDB.read_by : []
        })
    })

    if (currentChatId && conversationsData[currentChatId]) {
        renderMessages(conversationsData[currentChatId].messages, true, container)
        markMessagesRead(currentChatId)
    }
    renderContactList(container)
    ecouterNouveauxMessages(container)
}

function decoderMessage(contenu) {
    if (!contenu) return { type: 'text', text: '', url: '', fileName: '', fileSize: '' }
    if (contenu.startsWith('IMG|||')) { const p = contenu.split('|||'); return { type: 'image', text: '', url: p[1], fileName: '', fileSize: '' } }
    if (contenu.startsWith('FILE|||')) { const p = contenu.split('|||'); return { type: 'file', text: '', url: p[1], fileName: p[2], fileSize: p[3] } }
    return { type: 'text', text: contenu, url: '', fileName: '', fileSize: '' }
}

// ── Realtime ─────────────────────────────────────────────────────────────────
function ecouterNouveauxMessages(container) {
    if (realtimeChannel) { supabase.removeChannel(realtimeChannel); realtimeChannel = null }

    realtimeChannel = supabase.channel('messagerie-globale')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message' }, async payload => {
            const newMsg = payload.new
            if (newMsg.expediteur_id === myUserId) return

            const { data: profil } = await supabase.from('profils').select('prenom_nom').eq('id', newMsg.expediteur_id).maybeSingle()
            const senderName = profil?.prenom_nom || 'Inconnu'
            const date = new Date(newMsg.created_at)
            const timeStr = date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0')
            const decodage = decoderMessage(newMsg.contenu)
            const cId = newMsg.chat_id || 'global'

            if (!conversationsData[cId]) conversationsData[cId] = { name: senderName, isGroup: false, messages: [] }
            if (conversationsData[cId].messages.some(m => m.id === newMsg.id)) return

            conversationsData[cId].messages.push({
                id: newMsg.id, sender: senderName, time: timeStr, isMine: false, reaction: null,
                type: decodage.type, text: decodage.text, url: decodage.url,
                fileName: decodage.fileName, fileSize: decodage.fileSize,
                createdAt: newMsg.created_at, editedAt: newMsg.edited_at, deletedAt: newMsg.deleted_at,
                readBy: Array.isArray(newMsg.read_by) ? newMsg.read_by : []
            })

            if (hiddenChatIds.has(cId)) {
                hiddenChatIds.delete(cId)
                try { await supabase.from('chats_caches').delete().eq('user_id', myUserId).eq('chat_id', cId) } catch (e) { console.warn('[messagerie] Impossible de supprimer le cache chat:', e?.message) }
            }

            if (currentChatId === cId) {
                renderMessages(conversationsData[cId].messages, true, container)
                markMessagesRead(cId)
            }
            renderContactList(container)
            if (currentChatId !== cId) notifierNouveauMessage(senderName, cId, container)
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'message' }, payload => {
            const msg = payload.new
            const cId = msg.chat_id || 'global'
            const chat = conversationsData[cId]
            if (!chat) return
            const local = chat.messages.find(m => m.id === msg.id || m.id == msg.id)
            if (!local) return
            const d = decoderMessage(msg.contenu)
            Object.assign(local, { text: d.text, url: d.url, fileName: d.fileName, fileSize: d.fileSize, editedAt: msg.edited_at, deletedAt: msg.deleted_at, reaction: msg.reaction || null, readBy: Array.isArray(msg.read_by) ? msg.read_by : local.readBy || [] })
            if (currentChatId === cId) renderMessages(chat.messages, false, container)
            renderContactList(container)
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message' }, payload => {
            const deletedId = payload.old?.id
            if (!deletedId) return
            Object.values(conversationsData).forEach(chat => {
                const idx = chat.messages.findIndex(m => m.id === deletedId || m.id == deletedId)
                if (idx >= 0) chat.messages.splice(idx, 1)
            })
            if (currentChatId && conversationsData[currentChatId]) renderMessages(conversationsData[currentChatId].messages, false, container)
            renderContactList(container)
        })
        .on('system', {}, status => {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                setTimeout(() => ecouterNouveauxMessages(container), 3000)
            }
        })
        .subscribe()
}

function notifierNouveauMessage(senderName, chatId, container) {
    // Badge dans la sidebar principale (événement DOM — plus de postMessage)
    window.dispatchEvent(new CustomEvent('new_message_notif', { detail: { sender: senderName, chatId } }))
    if (!document.title.startsWith('●')) document.title = '● ' + document.title
    if (!_titleNotifPending) {
        _titleNotifPending = true
        document.addEventListener('visibilitychange', function handler() {
            if (!document.hidden) {
                document.title = document.title.replace('● ', '')
                _titleNotifPending = false
                document.removeEventListener('visibilitychange', handler)
            }
        })
    }
    container.querySelectorAll('.contact-item').forEach(item => {
        if (item.dataset.chatId === chatId) {
            item.style.borderLeft = '3px solid var(--accent)'
            setTimeout(() => { item.style.borderLeft = '' }, 5000)
        }
    })
}

// ── Envoi messages ───────────────────────────────────────────────────────────
async function sendMessage(container) {
    const messageInput = container.querySelector('#messageInput')
    const btnSend = container.querySelector('#btnSendMsg')
    const text = messageInput.value.trim()
    const hasFiles = selectedFiles.length > 0
    if ((!text && !hasFiles) || !currentChatId) return
    if (btnSend?.disabled) return

    if (_editingMsgId) {
        if (!text) { showAlert("Le message ne peut pas être vide.", container); return }
        const ok = await saveEditedMessage(text, container)
        if (ok) messageInput.value = ''
        return
    }

    if (btnSend) { btnSend.disabled = true; btnSend.style.opacity = '0.5' }
    try {
        const activeChat = conversationsData[currentChatId]
        const now = new Date()
        const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0')

        if (hasFiles) {
            const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 Mo
            const ALLOWED_EXT = new Set(['jpg','jpeg','png','gif','webp','pdf','doc','docx','xls','xlsx','csv','txt','zip','mp4','mov'])
            const files = [...selectedFiles]; selectedFiles = []; renderPreviews(container)
            for (const file of files) {
                if (file.size > MAX_FILE_SIZE) { showAlert(`Fichier trop volumineux : ${file.name} (max 20 Mo)`, container); continue }
                const fileExt = file.name.split('.').pop().toLowerCase()
                if (!ALLOWED_EXT.has(fileExt)) { showAlert(`Type de fichier non autorisé : .${fileExt}`, container); continue }
                const filePath = `${myUserId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
                if (btnSend) btnSend.title = `Envoi de ${file.name}...`
                const { error: uploadError } = await supabase.storage.from('pieces_jointes').upload(filePath, file)
                if (uploadError) { showAlert("Erreur d'envoi du fichier : " + uploadError.message, container); continue }
                const { data: { publicUrl } } = supabase.storage.from('pieces_jointes').getPublicUrl(filePath)
                const isImg = file.type.startsWith('image/')
                const fileSizeTxt = Math.round(file.size / 1024) + ' KB'
                const contenu = isImg ? `IMG|||${publicUrl}` : `FILE|||${publicUrl}|||${file.name}|||${fileSizeTxt}`
                activeChat.messages.push({ id: Date.now(), sender: myUserName, time: timeStr, isMine: true, reaction: null, type: isImg ? 'image' : 'file', text: '', url: publicUrl, fileName: file.name, fileSize: fileSizeTxt })
                renderMessages(activeChat.messages, true, container)
                await supabase.from('message').insert([{ contenu, expediteur_id: myUserId, chat_id: currentChatId }])
            }
        }

        if (text) {
            activeChat.messages.push({ id: Date.now(), sender: myUserName, text, time: timeStr, isMine: true, type: 'text', reaction: null })
            messageInput.value = ''
            renderMessages(activeChat.messages, true, container)
            const { error } = await supabase.from('message').insert([{ contenu: text, expediteur_id: myUserId, chat_id: currentChatId }])
            if (error) showAlert(friendlyError(error), container)
        }
        renderContactList(container)
    } finally {
        if (btnSend) { btnSend.disabled = false; btnSend.style.opacity = ''; btnSend.title = '' }
    }
}

// ── Rendu ────────────────────────────────────────────────────────────────────

function getContactInitials(name) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

function getUnreadCount(chatId) {
    if (chatId === currentChatId) return 0
    const chat = conversationsData[chatId]
    if (!chat) return 0
    return chat.messages.filter(m => !m.isMine && !m.deletedAt && (!Array.isArray(m.readBy) || !m.readBy.includes(myUserId))).length
}

function getChatCategory(chatId) {
    if (chatId === 'global' || chatId.startsWith('groupe_')) return 'equipe'
    const chat = conversationsData[chatId]
    if (chat?.isGroup) return 'equipe'
    const parts = chatId.split('_')
    const otherId = parts[0] === myUserId ? parts[1] : parts[0]
    if (otherId && allEmployees.some(e => e.id === otherId)) return 'equipe'
    return 'clients'
}

function updateFilterTabCounts(container) {
    const counts = { equipe: 0, clients: 0, fournisseurs: 0 }
    Object.entries(conversationsData).forEach(([id]) => {
        if (id !== 'global' && hiddenChatIds.has(id)) return
        const unread = getUnreadCount(id)
        if (unread > 0) {
            const cat = getChatCategory(id)
            if (counts[cat] !== undefined) counts[cat] += unread
        }
    })
    ;['equipe', 'clients', 'fournisseurs'].forEach(cat => {
        const badge = container.querySelector(`#badge-${cat}`)
        if (!badge) return
        if (counts[cat] > 0) { badge.textContent = counts[cat]; badge.style.display = 'inline-flex' }
        else badge.style.display = 'none'
    })
}

function updateSidebarStats(container) {
    const el = container.querySelector('#sidebar-stats')
    if (!el) return
    const visible = Object.entries(conversationsData).filter(([id]) => id === 'global' || !hiddenChatIds.has(id))
    const nonLues = visible.filter(([id]) => getUnreadCount(id) > 0).length
    const total = visible.length
    el.textContent = nonLues > 0
        ? `${nonLues} conversation${nonLues !== 1 ? 's' : ''} non lue${nonLues !== 1 ? 's' : ''}`
        : `${total} conversation${total !== 1 ? 's' : ''}`
}

function renderContactList(container) {
    const list = container.querySelector('#contactListContainer')
    if (!list) return
    list.innerHTML = ''
    Object.entries(conversationsData).reverse().forEach(([id, chat]) => {
        if (id !== 'global' && hiddenChatIds.has(id)) return
        if (currentFilter !== 'tous' && getChatCategory(id) !== currentFilter) return
        const isActive = id === currentChatId ? 'active' : ''
        const avatarColor = getAvatarColor(chat.name)
        const avatarClass = chat.isGroup ? 'avatar-group' : ''
        const avatarContent = chat.isGroup ? `<svg viewBox="0 0 24 24"><use href="#msg-users"/></svg>` : getContactInitials(chat.name)
        const avatarBg = chat.isGroup ? '' : `background:${avatarColor}`
        let lastMsgDisplay = 'Nouvelle discussion', lastTime = ''
        if (chat.messages?.length) {
            const last = chat.messages[chat.messages.length - 1]
            const rawMsg = last.type === 'text' ? last.text : (last.type === 'image' ? '📷 Image' : '📎 Fichier')
            if (last.isMine) lastMsgDisplay = 'Vous: ' + rawMsg
            else if (chat.isGroup && last.sender) lastMsgDisplay = `${last.sender.split(' ')[0]}: ${rawMsg}`
            else lastMsgDisplay = rawMsg
            lastTime = last.time
        }
        const unread = getUnreadCount(id)
        const unreadHTML = unread > 0 ? `<span class="contact-unread">${unread}</span>` : ''
        const deleteBg = id !== 'global' ? `<div class="delete-btn-bg" data-delete-chat="${id}"><svg><use href="#msg-trash"/></svg></div>` : ''
        const swipableClass = id !== 'global' ? 'swipable' : ''
        const wrapper = document.createElement('div')
        wrapper.className = 'contact-wrapper'
        wrapper.id = `wrapper-${id}`
        wrapper.innerHTML = `
            <div class="contact-item ${isActive} ${swipableClass} ${unread > 0 ? 'has-unread' : ''}" id="contact-${id}" data-chat-id="${id}">
                <div class="avatar-wrap"><div class="avatar ${avatarClass}" style="${avatarBg}">${avatarContent}</div></div>
                <div class="contact-info">
                    <div class="contact-name"><span>${sanitize(chat.name)}</span><span class="contact-time">${lastTime}</span></div>
                    <div class="contact-last-msg-row"><div class="contact-last-msg">${sanitize(lastMsgDisplay)}</div>${unreadHTML}</div>
                </div>
            </div>
            ${deleteBg}
        `
        const contactItem = wrapper.querySelector('.contact-item')
        contactItem.addEventListener('click', e => { if (e.target.closest('.delete-btn-bg')) return; openChat(id, container) })
        const deleteBtnBg = wrapper.querySelector('.delete-btn-bg')
        if (deleteBtnBg) deleteBtnBg.addEventListener('click', () => askDeleteChat(id, container))
        list.appendChild(wrapper)
    })
    updateSidebarStats(container)
    updateFilterTabCounts(container)
    attachSwipeListeners(container)
}

function highlightTerm(text, term) {
    if (!term || !text) return sanitize(text || '')
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = sanitize(text).split(new RegExp(`(${escaped})`, 'gi'))
    return parts.map((p, i) => i % 2 === 1 ? `<mark class="msg-highlight">${p}</mark>` : p).join('')
}

function renderMessages(messages, scroll = false, container) {
    const messagesContainer = container.querySelector('#chatMessages')
    if (!messagesContainer) return
    const scrollPos = messagesContainer.scrollTop
    messagesContainer.innerHTML = ''

    const track = document.createElement('div')
    track.className = 'messages-track'
    messagesContainer.appendChild(track)

    const term = _chatSearchTerm.toLowerCase()
    const filtered = term ? messages.filter(m => m.text && m.text.toLowerCase().includes(term)) : messages
    const countEl = container.querySelector('#chatSearchCount')
    if (countEl) countEl.textContent = term ? `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}` : ''

    const displayList = term ? filtered : messages

    if (!displayList.length) {
        track.innerHTML = term
            ? '<div style="text-align:center;color:#888;font-style:italic;margin-top:50px">Aucun message ne correspond à votre recherche.</div>'
            : '<div style="text-align:center;color:#888;font-style:italic;margin-top:50px">Envoyez un premier message pour démarrer la discussion.</div>'
        return
    }

    let lastDateKey = null
    displayList.forEach(msg => {
        // Séparateur de date (style iMessage)
        if (msg.createdAt) {
            const msgDate = new Date(msg.createdAt)
            const dateKey = msgDate.toDateString()
            if (dateKey !== lastDateKey) {
                lastDateKey = dateKey
                const sep = document.createElement('div')
                sep.className = 'msg-date-sep'
                sep.textContent = formatMsgDate(msgDate)
                track.appendChild(sep)
            }
        }

        const wrapper = document.createElement('div')
        wrapper.className = `message-wrapper ${msg.isMine ? 'sent' : 'received'}`
        wrapper.dataset.msgId = msg.id
        const senderHtml = !msg.isMine ? `<span class="message-sender">${sanitize(msg.sender)}</span>` : ''
        const reactionHtml = (msg.reaction && !msg.deletedAt) ? `<div class="msg-reaction-badge" data-remove-reaction="${msg.id}">${msg.reaction}</div>` : ''
        const editedTag = (msg.editedAt && !msg.deletedAt) ? `<span style="font-size:10px;opacity:0.6;margin-left:4px;font-style:italic"> (modifié)</span>` : ''

        let innerBubble = ''
        if (msg.deletedAt) {
            innerBubble = `<div class="message-bubble" style="background:#3a3b46!important;color:#888!important;font-style:italic"><svg style="width:14px;height:14px;vertical-align:-2px;margin-right:4px;opacity:0.6;stroke:#888;fill:none;stroke-width:2"><use href="#msg-trash"/></svg>Message supprimé</div>`
        } else if (msg.type === 'text') {
            const textContent = _chatSearchTerm ? highlightTerm(msg.text, _chatSearchTerm) : sanitize(msg.text)
            innerBubble = `<div class="message-bubble">${textContent}${editedTag}${reactionHtml}</div>`
        } else if (msg.type === 'image') {
            const safeUrl = sanitizeUrl(msg.url)
            innerBubble = `<div class="message-bubble bubble-image"><img src="${safeUrl}" data-open-url="${safeUrl}">${reactionHtml}</div>`
        } else if (msg.type === 'file') {
            const safeUrl = sanitizeUrl(msg.url)
            innerBubble = `<a href="${safeUrl}" target="_blank" class="message-bubble bubble-file"><div class="file-icon"><svg><use href="#msg-file"/></svg></div><div class="file-meta"><span class="file-name">${sanitize(msg.fileName)}</span><span class="file-size">${sanitize(msg.fileSize)}</span></div><div class="file-download-icon"><svg><use href="#msg-download"/></svg></div>${reactionHtml}</a>`
        }

        const reactBtnHtml = msg.deletedAt ? '' : `<button class="msg-react-btn" data-react-msg="${msg.id}"><svg><use href="#msg-smile"/></svg></button>`
        const isRead = msg.isMine && !msg.deletedAt && Array.isArray(msg.readBy) && msg.readBy.length > 0
        const readStatusHtml = isRead ? `<div class="msg-read-status"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/><polyline points="20 10 13 17 9 13"/></svg> Lu</div>` : ''

        wrapper.innerHTML = `<div class="msg-bubble-group">${senderHtml}<div class="message-content-row">${innerBubble}${reactBtnHtml}</div><div class="message-time">${sanitize(msg.time)}</div>${readStatusHtml}</div><span class="msg-time-side">${sanitize(msg.time)}</span>`
        track.appendChild(wrapper)

        // Event listeners
        wrapper.querySelectorAll('[data-remove-reaction]').forEach(el => el.addEventListener('click', () => removeReaction(el.dataset.removeReaction)))
        wrapper.querySelectorAll('[data-react-msg]').forEach(el => el.addEventListener('click', e => showReactionPicker(e, el.dataset.reactMsg, container)))
        wrapper.querySelectorAll('[data-open-url]').forEach(el => el.addEventListener('click', () => window.open(el.dataset.openUrl)))
        if (msg.isMine && !msg.deletedAt) attachLongPress(wrapper, msg, container)
    })

    if (scroll) messagesContainer.scrollTop = messagesContainer.scrollHeight
    else messagesContainer.scrollTop = scrollPos

    attachSwipeReveal(messagesContainer, track)
}

function filterContacts(container) {
    const term = container.querySelector('#searchContactInput').value.toLowerCase()
    container.querySelectorAll('#contactListContainer .contact-wrapper').forEach(w => {
        w.style.display = w.textContent.toLowerCase().includes(term) ? 'block' : 'none'
    })
}

function openChat(chatId, container) {
    if (!conversationsData[chatId]) return
    currentChatId = chatId
    const chat = conversationsData[chatId]
    container.querySelector('#chatHeaderName').textContent = chat.name || 'Inconnu'
    const sub = container.querySelector('#chatHeaderSub')
    if (sub) sub.innerHTML = chat.isGroup ? 'Groupe' : '<span class="status-online"><span class="status-dot"></span>En ligne</span>'
    const avatarBox = container.querySelector('#chatHeaderAvatar')
    avatarBox.className = chat.isGroup ? 'avatar avatar-group' : 'avatar'
    avatarBox.style.background = (!chat.isGroup && chat.name) ? getAvatarColor(chat.name) : ''
    avatarBox.style.border = (!chat.isGroup && chat.name) ? 'none' : ''
    avatarBox.style.fontSize = '14px'
    avatarBox.innerHTML = chat.isGroup ? `<svg><use href="#msg-users"/></svg>` : getContactInitials(chat.name)
    renderContactList(container)
    renderMessages(chat.messages || [], true, container)
    markMessagesRead(chatId)
    if (window.innerWidth <= 900) container.querySelector('#view-dashboard').classList.add('show-chat')
    selectedFiles = []; renderPreviews(container)
}

function closeChat(container) {
    container.querySelector('#view-dashboard').classList.remove('show-chat')
}

// ── Nouveau chat ──────────────────────────────────────────────────────────────
function openNewChatModal(container) {
    const list = container.querySelector('#newChatUserList')
    list.innerHTML = ''
    allEmployees.forEach(emp => {
        const label = document.createElement('label')
        label.className = 'user-select-row'
        label.id = `row-${emp.id}`
        label.innerHTML = `
            <input type="checkbox" class="new-chat-cb" value="${emp.id}" data-name="${sanitize(emp.name)}" data-initials="${sanitize(emp.initials)}">
            <div class="user-info">
                <div class="avatar" style="width:36px;height:36px;font-size:14px;margin:0">${sanitize(emp.initials)}</div>
                <span class="user-select-name">${sanitize(emp.name)}</span>
            </div>
            <div class="custom-checkbox"></div>
        `
        label.querySelector('input').addEventListener('change', cb => {
            label.classList.toggle('selected', cb.target.checked)
            const selected = container.querySelectorAll('.new-chat-cb:checked')
            const grp = container.querySelector('#groupNameGroup')
            if (selected.length > 1) grp.classList.add('show')
            else grp.classList.remove('show')
        })
        list.appendChild(label)
    })
    container.querySelector('#newGroupName').value = ''
    container.querySelector('#groupNameGroup').classList.remove('show')
    container.querySelector('#newChatModal').classList.add('open')
}

async function createNewChat(container) {
    const selected = container.querySelectorAll('.new-chat-cb:checked')
    if (!selected.length) { showAlert('Veuillez sélectionner au moins une personne.', container); return }

    let newChatId, newChat
    if (selected.length === 1) {
        const otherId = selected[0].value
        newChatId = [myUserId, otherId].sort().join('_')
        newChat = { name: selected[0].dataset.name, isGroup: false, messages: [] }
    } else {
        newChatId = 'groupe_' + Date.now()
        const groupName = container.querySelector('#newGroupName').value.trim() || 'Nouveau Groupe'
        newChat = { name: groupName, isGroup: true, messages: [] }
    }

    if (!conversationsData[newChatId]) conversationsData[newChatId] = newChat
    if (hiddenChatIds.has(newChatId)) {
        hiddenChatIds.delete(newChatId)
        try { await supabase.from('chats_caches').delete().eq('user_id', myUserId).eq('chat_id', newChatId) } catch (e) { console.warn('[messagerie] Impossible de supprimer le cache chat:', e?.message) }
    }

    closeModal('newChatModal', container)
    renderContactList(container)
    openChat(newChatId, container)
}

// ── Masquer chat ──────────────────────────────────────────────────────────────
function askDeleteChat(chatId, container) {
    if (chatId === 'global') return
    currentChatIdToDelete = chatId
    container.querySelector('#confirmDeleteModal').classList.add('open')
}

function cancelDeleteChat(container) {
    closeModal('confirmDeleteModal', container)
    if (_currentlySwipedItem) { _currentlySwipedItem.classList.remove('swiped'); _currentlySwipedItem = null }
    currentChatIdToDelete = null
}

async function executeDeleteChat(container) {
    if (!currentChatIdToDelete || currentChatIdToDelete === 'global') return
    const chatId = currentChatIdToDelete
    try {
        const { error } = await supabase.from('chats_caches').upsert({ user_id: myUserId, chat_id: chatId }, { onConflict: 'user_id,chat_id' })
        if (error) throw error
    } catch (e) { showAlert('❌ Impossible de masquer : ' + e.message, container); return }
    hiddenChatIds.add(chatId)
    closeModal('confirmDeleteModal', container)
    if (currentChatId === chatId) {
        currentChatId = null
        container.querySelector('#chatHeaderName').textContent = 'Sélectionnez une discussion'
        container.querySelector('#chatHeaderAvatar').innerHTML = ''
        container.querySelector('#chatMessages').innerHTML = '<div style="text-align:center;color:#888;font-style:italic;margin-top:50px">Aucune conversation sélectionnée.</div>'
        closeChat(container)
    }
    renderContactList(container)
    currentChatIdToDelete = null
}

// ── Pièces jointes ────────────────────────────────────────────────────────────
function handleFileSelect(e, container) {
    selectedFiles = selectedFiles.concat(Array.from(e.target.files))
    renderPreviews(container)
    e.target.value = ''
}

function renderPreviews(container) {
    const preview = container.querySelector('#attachmentPreview')
    const attachBtn = container.querySelector('#attachBtn')
    _previewBlobUrls.forEach(u => URL.revokeObjectURL(u))
    _previewBlobUrls = []
    preview.innerHTML = ''
    if (selectedFiles.length > 0) {
        attachBtn.classList.add('active')
        selectedFiles.forEach((file, idx) => {
            const div = document.createElement('div')
            if (file.type.startsWith('image/')) {
                div.className = 'preview-item'
                const img = document.createElement('img')
                const blobUrl = URL.createObjectURL(file)
                _previewBlobUrls.push(blobUrl)
                img.src = blobUrl
                div.appendChild(img)
            } else {
                div.className = 'preview-item-file'
                const name = file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name
                div.innerHTML = `<div style="width:16px;height:16px"><svg><use href="#msg-file"/></svg></div><span>${sanitize(name)}</span>`
            }
            const rmBtn = document.createElement('button')
            rmBtn.className = 'remove-attachment'
            rmBtn.textContent = '×'
            rmBtn.addEventListener('click', () => { selectedFiles.splice(idx, 1); renderPreviews(container) })
            div.appendChild(rmBtn)
            preview.appendChild(div)
        })
    } else {
        attachBtn.classList.remove('active')
    }
}

// ── Réactions ─────────────────────────────────────────────────────────────────
function openFullPicker(container) {
    isCustomizing = false
    const fullPicker = container.querySelector('#fullPickerModal')
    if (fullPicker) fullPicker.style.display = 'flex'
    const reactionPicker = container.querySelector('#reactionPicker')
    if (reactionPicker) reactionPicker.style.display = 'none'
    renderTopQuickReactions(container)
    window.dispatchEvent(new CustomEvent('toggle_menu', { detail: { action: 'hide' } }))
}

function toggleCustomizeMode() {
    isCustomizing = !isCustomizing
    const btn = document.getElementById('btnToggleCustomize')
    if (!btn) return
    if (isCustomizing) {
        btn.textContent = 'Terminé'
        btn.style.color = 'var(--btn-green)'
        selectedCustomizeIndex = 0
    } else {
        btn.textContent = 'Personnaliser'
        btn.style.color = 'var(--btn-blue)'
        selectedCustomizeIndex = null
        localStorage.setItem('dussault_quick_reacts', JSON.stringify(quickReactions))
        const container = document.getElementById('app-container')
        if (container) renderQuickReactions(container)
    }
    const container = document.getElementById('app-container')
    if (container) renderTopQuickReactions(container)
}

function renderTopQuickReactions(container) {
    const c = container.querySelector('#topQuickReactions')
    if (!c) return
    c.innerHTML = ''
    quickReactions.forEach((emoji, index) => {
        const div = document.createElement('div')
        div.className = 'top-react-slot' + (isCustomizing && selectedCustomizeIndex === index ? ' active-slot' : '')
        div.textContent = emoji
        if (isCustomizing) {
            div.onclick = () => { selectedCustomizeIndex = index; renderTopQuickReactions(container) }
        } else {
            div.onclick = () => { selectReaction(emoji, container); closeModal('fullPickerModal', container) }
        }
        c.appendChild(div)
    })
}

function renderQuickReactions(container) {
    const list = document.getElementById('quickReactionsList')
    if (!list) return
    list.innerHTML = ''
    quickReactions.forEach(emoji => {
        const span = document.createElement('span')
        span.textContent = emoji
        span.addEventListener('click', () => selectReaction(emoji, container))
        list.appendChild(span)
    })
}

function showReactionPicker(e, msgId, container) {
    e.stopPropagation()
    currentReactMsgId = msgId
    const picker = document.getElementById('reactionPicker')
    if (!picker) return
    picker.style.display = 'flex'
    const rect = e.currentTarget.getBoundingClientRect()
    let top = rect.top - 55, left = rect.left - 130
    if (top < 10) top = rect.bottom + 10
    if (left < 10) left = 10
    if (left + 200 > window.innerWidth) left = window.innerWidth - 210
    picker.style.top = top + 'px'
    picker.style.left = left + 'px'
    renderQuickReactions(container)
}

async function selectReaction(emoji, container) {
    if (!currentReactMsgId || !currentChatId) return
    const chat = conversationsData[currentChatId]
    const msg = chat?.messages.find(m => m.id === currentReactMsgId || m.id == currentReactMsgId)
    if (msg) {
        msg.reaction = emoji
        renderMessages(chat.messages, false, container)
        try { await supabase.from('message').update({ reaction: emoji }).eq('id', currentReactMsgId) } catch (e) { console.warn('[messagerie] Impossible de sauvegarder la réaction:', e?.message) }
    }
    document.getElementById('reactionPicker').style.display = 'none'
}

async function removeReaction(msgId) {
    if (!currentChatId) return
    const chat = conversationsData[currentChatId]
    const msg = chat?.messages.find(m => m.id === msgId || m.id == msgId)
    if (msg) { msg.reaction = null; try { await supabase.from('message').update({ reaction: null }).eq('id', msgId) } catch {} }
}

// ── Long press / édition / suppression ───────────────────────────────────────
function attachLongPress(wrapper, msg, container) {
    const start = e => {
        const t = e.touches ? e.touches[0] : e
        _longPressStartXY = { x: t.clientX, y: t.clientY }
        _longPressTimer = setTimeout(() => {
            _longPressTimer = null
            try { navigator.vibrate?.(40) } catch {}
            openMessageActionMenu(msg, container)
        }, LONG_PRESS_MS)
    }
    const move = e => {
        if (!_longPressTimer || !_longPressStartXY) return
        const t = e.touches ? e.touches[0] : e
        if (Math.abs(t.clientX - _longPressStartXY.x) > 10 || Math.abs(t.clientY - _longPressStartXY.y) > 10) {
            clearTimeout(_longPressTimer); _longPressTimer = null
        }
    }
    const cancel = () => { if (_longPressTimer) { clearTimeout(_longPressTimer); _longPressTimer = null } }
    wrapper.addEventListener('touchstart', start, { passive: true })
    wrapper.addEventListener('touchmove', move, { passive: true })
    wrapper.addEventListener('touchend', cancel)
    wrapper.addEventListener('touchcancel', cancel)
    wrapper.addEventListener('mousedown', start)
    wrapper.addEventListener('mousemove', move)
    wrapper.addEventListener('mouseup', cancel)
    wrapper.addEventListener('mouseleave', cancel)
    wrapper.addEventListener('contextmenu', e => { e.preventDefault(); openMessageActionMenu(msg, container) })
}

function openMessageActionMenu(msg, container) {
    const ageMs = Date.now() - (msg.createdAt ? new Date(msg.createdAt).getTime() : 0)
    const canEdit = msg.type === 'text' && ageMs < 5 * 60 * 1000

    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px'
    overlay.innerHTML = `
        <div style="background:#2a2b35;border-radius:14px;padding:8px;min-width:240px;box-shadow:0 12px 40px rgba(0,0,0,0.5)">
            ${canEdit
                ? `<button data-act="edit" style="display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;background:transparent;border:none;color:#fff;font-size:15px;cursor:pointer;border-radius:10px;text-align:left"><svg style="width:18px;height:18px;stroke:var(--btn-blue);fill:none;stroke-width:2"><use href="#msg-edit"/></svg> Modifier</button>`
                : `<div style="display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;color:#666;font-size:13px;font-style:italic"><svg style="width:18px;height:18px;stroke:#666;fill:none;stroke-width:2;opacity:.5"><use href="#msg-edit"/></svg> Modifier (limite 5 min dépassée)</div>`}
            <button data-act="delete" style="display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;background:transparent;border:none;color:var(--btn-red);font-size:15px;cursor:pointer;border-radius:10px;text-align:left"><svg style="width:18px;height:18px;stroke:var(--btn-red);fill:none;stroke-width:2"><use href="#msg-trash"/></svg> Supprimer</button>
            <div style="height:1px;background:#444;margin:4px 12px"></div>
            <button data-act="cancel" style="display:flex;align-items:center;justify-content:center;width:100%;padding:14px 16px;background:transparent;border:none;color:#aaa;font-size:14px;cursor:pointer;border-radius:10px">Annuler</button>
        </div>
    `
    overlay.querySelectorAll('[data-act]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.body.removeChild(overlay)
            if (btn.dataset.act === 'edit') startEditMessage(msg, container)
            else if (btn.dataset.act === 'delete') confirmDeleteMessage(msg, container)
        })
    })
    overlay.addEventListener('click', e => { if (e.target === overlay) document.body.removeChild(overlay) })
    document.body.appendChild(overlay)
}

function startEditMessage(msg, container) {
    const input = container.querySelector('#messageInput')
    if (!input) return
    _editingMsgId = msg.id
    input.value = msg.text || ''
    input.focus()
    // Bannière de modification
    const old = container.querySelector('#editing-banner')
    if (old) old.remove()
    const banner = document.createElement('div')
    banner.id = 'editing-banner'
    banner.style.cssText = 'background:rgba(91,192,235,0.15);border-left:3px solid var(--btn-blue);padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;border-radius:6px'
    banner.innerHTML = `
        <div style="flex:1;min-width:0">
            <div style="font-size:11px;color:var(--btn-blue);font-weight:600;margin-bottom:2px">Modification du message</div>
            <div style="font-size:13px;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sanitize(msg.text || '')}</div>
        </div>
        <button id="btnCancelEdit" style="background:transparent;border:none;color:#888;cursor:pointer;padding:4px;font-size:18px">×</button>
    `
    banner.querySelector('#btnCancelEdit').addEventListener('click', () => cancelEditMessage(container))
    const inputArea = container.querySelector('.chat-input-area')
    inputArea.parentElement.insertBefore(banner, inputArea)
}

function cancelEditMessage(container) {
    _editingMsgId = null
    const input = container.querySelector('#messageInput')
    if (input) input.value = ''
    const banner = container.querySelector('#editing-banner')
    if (banner) banner.remove()
}

async function saveEditedMessage(newText, container) {
    if (!_editingMsgId) return false
    const editedId = _editingMsgId
    try {
        const { error } = await supabase.from('message').update({ contenu: newText, edited_at: new Date().toISOString() }).eq('id', editedId).eq('expediteur_id', myUserId)
        if (error) throw error
        const chat = conversationsData[currentChatId]
        if (chat) {
            const m = chat.messages.find(x => x.id === editedId || x.id == editedId)
            if (m) { m.text = newText; m.editedAt = new Date().toISOString(); renderMessages(chat.messages, false, container) }
        }
        cancelEditMessage(container)
        return true
    } catch (e) { showAlert('Erreur lors de la modification : ' + (e.message || 'inconnue'), container); return false }
}

function confirmDeleteMessage(msg, container) {
    showConfirmAction('Supprimer ce message ?', async () => {
        try {
            const { error } = await supabase.from('message').update({ deleted_at: new Date().toISOString() }).eq('id', msg.id).eq('expediteur_id', myUserId)
            if (error) throw error
            const chat = conversationsData[currentChatId]
            if (chat) {
                const m = chat.messages.find(x => x.id === msg.id || x.id == msg.id)
                if (m) { m.deletedAt = new Date().toISOString(); renderMessages(chat.messages, false, container) }
            }
        } catch (e) { showAlert('Erreur lors de la suppression : ' + (e.message || 'inconnue'), container) }
    }, container)
}

// ── Swipe to delete ───────────────────────────────────────────────────────────
function attachSwipeListeners(container) {
    container.querySelectorAll('.contact-item.swipable').forEach(item => {
        if (item.dataset.swipeBound === '1') return
        item.dataset.swipeBound = '1'
        item.addEventListener('touchstart', onSwipeStart, { passive: true })
        item.addEventListener('touchmove', onSwipeMove, { passive: false })
        item.addEventListener('touchend', e => onSwipeEnd(e, container))
        item.addEventListener('touchcancel', e => onSwipeEnd(e, container))
        item.addEventListener('click', e => onSwipeClick(e, container), true)
    })
}

function onSwipeStart(e) {
    if (!e.touches || e.touches.length !== 1) return
    const t = e.touches[0]
    _swipeState = { item: e.currentTarget, startX: t.clientX, startY: t.clientY, currentDelta: 0, isHorizontal: null, wasSwiped: e.currentTarget.classList.contains('swiped') }
    e.currentTarget.classList.add('swiping')
}

function onSwipeMove(e) {
    if (!_swipeState || !e.touches || e.touches.length !== 1) return
    const t = e.touches[0]
    const dx = t.clientX - _swipeState.startX
    const dy = t.clientY - _swipeState.startY
    if (_swipeState.isHorizontal === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        _swipeState.isHorizontal = Math.abs(dx) > Math.abs(dy) * 0.8 && Math.abs(dy) < Math.abs(dx) * 1.5
        if (!_swipeState.isHorizontal) { _swipeState.item.classList.remove('swiping'); _swipeState = null; return }
    }
    e.preventDefault()
    let offset = _swipeState.wasSwiped ? -SWIPE_MAX + dx : dx
    if (offset > 0) offset = 0
    if (offset < -SWIPE_MAX - 30) offset = -SWIPE_MAX - 30
    _swipeState.currentDelta = offset
    _swipeState.item.style.transform = `translateX(${offset}px)`
}

function onSwipeEnd(e, container) {
    if (!_swipeState) return
    const item = _swipeState.item
    const delta = Math.abs(_swipeState.currentDelta)
    item.classList.remove('swiping')
    item.style.transform = ''
    if (delta >= SWIPE_THRESHOLD_DELETE) {
        item.classList.remove('swiped')
        const chatId = item.dataset.chatId
        if (chatId) askDeleteChat(chatId, container)
    } else if (delta >= SWIPE_THRESHOLD_OPEN) {
        container.querySelectorAll('.contact-item.swiped').forEach(el => { if (el !== item) el.classList.remove('swiped') })
        item.classList.add('swiped')
        _currentlySwipedItem = item
    } else {
        item.classList.remove('swiped')
        if (_currentlySwipedItem === item) _currentlySwipedItem = null
    }
    _swipeState = null
}

function onSwipeClick(e, container) {
    const item = e.currentTarget
    if (item.classList.contains('swiped')) {
        e.preventDefault(); e.stopPropagation()
        item.classList.remove('swiped')
        if (_currentlySwipedItem === item) _currentlySwipedItem = null
        return
    }
    if (_currentlySwipedItem && _currentlySwipedItem !== item) {
        _currentlySwipedItem.classList.remove('swiped'); _currentlySwipedItem = null
    }
}

// ── Accusés de lecture ────────────────────────────────────────────────────────
async function markMessagesRead(chatId) {
    if (!chatId || !myUserId) return
    const chat = conversationsData[chatId]
    if (!chat?.messages?.length) return
    for (const m of chat.messages) {
        if (m.isMine || m.deletedAt) continue
        if (!Array.isArray(m.readBy)) m.readBy = []
        if (m.readBy.includes(myUserId)) continue
        const newReadBy = [...m.readBy, myUserId]
        m.readBy = newReadBy
        // Only update real DB rows (UUIDs or small ints), skip optimistic Date.now() IDs
        if (typeof m.id !== 'number' || m.id < 2e12) {
            supabase.from('message').update({ read_by: newReadBy }).eq('id', m.id).then(() => {}).catch(() => {})
        }
    }
}

// ── Recherche in-chat ─────────────────────────────────────────────────────────
function closeChatSearch(container) {
    _chatSearchTerm = ''
    container.querySelector('#chatSearchBar').classList.remove('show')
    container.querySelector('#btnChatSearch').classList.remove('active')
    container.querySelector('#chatSearchInput').value = ''
    const countEl = container.querySelector('#chatSearchCount')
    if (countEl) countEl.textContent = ''
    if (currentChatId && conversationsData[currentChatId]) renderMessages(conversationsData[currentChatId].messages, false, container)
}

// ── Utilitaires ───────────────────────────────────────────────────────────────
function showAlert(msg, container) {
    const el = container.querySelector('#alertMessage')
    if (el) el.textContent = msg
    container.querySelector('#alertModal').classList.add('open')
}

function showConfirmAction(msg, callback, container) {
    container.querySelector('#confirmActionMsg').textContent = msg
    container._confirmCallback = callback
    container.querySelector('#confirmActionModal').classList.add('open')
}

// ── Swipe pour révéler l'heure (style iMessage) ──────────────────────────────
function attachSwipeReveal(messagesContainer, track) {
    let startX = null, startY = null, isHorizontal = null
    const MAX = 72

    const onStart = e => {
        if (e.touches.length !== 1) return
        startX = e.touches[0].clientX
        startY = e.touches[0].clientY
        isHorizontal = null
        track.style.transition = 'none'
    }
    const onMove = e => {
        if (startX === null) return
        const dx = e.touches[0].clientX - startX
        const dy = e.touches[0].clientY - startY
        if (isHorizontal === null) {
            if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
            isHorizontal = Math.abs(dx) > Math.abs(dy) * 0.9
            if (!isHorizontal) { startX = null; return }
        }
        if (!isHorizontal) return
        const offset = Math.max(-MAX, Math.min(0, dx))
        track.style.transform = `translateX(${offset}px)`
    }
    const onEnd = () => {
        startX = null; startY = null; isHorizontal = null
        track.style.transition = 'transform 0.25s ease'
        track.style.transform = 'translateX(0)'
    }

    messagesContainer.addEventListener('touchstart', onStart, { passive: true })
    messagesContainer.addEventListener('touchmove', onMove, { passive: true })
    messagesContainer.addEventListener('touchend', onEnd)
    messagesContainer.addEventListener('touchcancel', onEnd)
}

function formatMsgDate(date) {
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
    const d = new Date(date); d.setHours(0, 0, 0, 0)
    if (d.getTime() === now.getTime()) return "Aujourd'hui"
    if (d.getTime() === yesterday.getTime()) return 'Hier'
    const diffDays = Math.round((now - d) / 86400000)
    if (diffDays < 7) return date.toLocaleDateString('fr-FR', { weekday: 'long' })
    if (diffDays < 365) return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function closeModal(id, container) {
    container.querySelector(`#${id}`)?.classList.remove('open')
}
