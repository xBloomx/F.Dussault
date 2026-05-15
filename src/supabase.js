// src/supabase.js
// Client Supabase unique — importé par tous les modules
// Remplace les 12 instances séparées de l'ancienne architecture iframe

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Variables Supabase manquantes dans .env')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        storageKey: 'fdussault-auth-v1',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    }
})