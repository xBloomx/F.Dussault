import { describe, it, expect, vi } from 'vitest'

vi.mock('./supabase.js', () => ({
    supabase: {
        auth: { getUser: vi.fn(), onAuthStateChange: vi.fn() },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null })
        }))
    }
}))

vi.mock('./shared/toast.js', () => ({ showToast: vi.fn() }))

describe('hasPermission', () => {
    it('retourne false pour un rôle sans permissions (état initial A3)', async () => {
        const { hasPermission } = await import('./auth.js')
        // État initial : currentRole = 'A3', perms vides → tout est refusé
        expect(hasPermission('view_admin')).toBe(false)
        expect(hasPermission('access_po_tab')).toBe(false)
    })

    it('hasPermission est bien une fonction exportée', async () => {
        const { hasPermission } = await import('./auth.js')
        expect(typeof hasPermission).toBe('function')
    })

    it('currentRole initial est A3', async () => {
        const { currentRole } = await import('./auth.js')
        expect(currentRole).toBe('A3')
    })
})
