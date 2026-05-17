import { describe, it, expect, vi } from 'vitest'
import { withRetry } from './withRetry.js'

describe('withRetry', () => {
    it('retourne le résultat au premier essai si pas d\'erreur', async () => {
        const op = vi.fn().mockResolvedValue({ data: 'ok', error: null })
        const result = await withRetry(op)
        expect(result).toEqual({ data: 'ok', error: null })
        expect(op).toHaveBeenCalledTimes(1)
    })

    it('réessaie sur une erreur réseau transitoire', async () => {
        const networkError = new Error('failed to fetch')
        const op = vi.fn()
            .mockRejectedValueOnce(networkError)
            .mockResolvedValue({ data: 'ok', error: null })
        const result = await withRetry(op, { delay: 0 })
        expect(result).toEqual({ data: 'ok', error: null })
        expect(op).toHaveBeenCalledTimes(2)
    })

    it('ne réessaie pas sur une erreur non-transitoire', async () => {
        const op = vi.fn().mockResolvedValue({ data: null, error: { message: 'Permission refusée', code: 403 } })
        const result = await withRetry(op, { delay: 0 })
        expect(result.error).toBeDefined()
        expect(op).toHaveBeenCalledTimes(1)
    })

    it('abandonne après maxAttempts', async () => {
        const op = vi.fn().mockRejectedValue(new Error('failed to fetch'))
        const result = await withRetry(op, { delay: 0, maxAttempts: 2 })
        expect(result.error).toBeDefined()
        expect(op).toHaveBeenCalledTimes(2)
    })
})
