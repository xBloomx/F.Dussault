// src/shared/toast.js
// Système de toast/snackbar — remplace window.showToast de l'ancien shared.js

let container = null

function ensureContainer() {
    if (!container) {
        container = document.getElementById('toast-container')
    }
    return container
}

export function showToast(message, type = 'info', duration = 3000) {
    // On n'affiche que les erreurs et avertissements
    if (type !== 'error' && type !== 'warning') return

    const c = ensureContainer()
    if (!c) return

    const toast = document.createElement('div')
    toast.className = `shared-toast ${type}`
    toast.textContent = message
    c.appendChild(toast)

    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'))
    })

    setTimeout(() => {
        toast.classList.remove('show')
        setTimeout(() => toast.remove(), 300)
    }, duration)
}

export function showError(message) {
    showToast(message, 'error', 4000)
}

export function showWarning(message) {
    showToast(message, 'warning', 3000)
}