import { describe, it, expect } from 'vitest'
import { sanitize } from './sanitize.js'

describe('sanitize', () => {
    it('échappe les balises HTML', () => {
        expect(sanitize('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    })

    it('échappe les guillemets', () => {
        expect(sanitize('"test"')).toBe('&quot;test&quot;')
        expect(sanitize("'test'")).toBe('&#39;test&#39;')
    })

    it('échappe le &', () => {
        expect(sanitize('A&B')).toBe('A&amp;B')
    })

    it('retourne une chaîne vide pour null/undefined', () => {
        expect(sanitize(null)).toBe('')
        expect(sanitize(undefined)).toBe('')
    })

    it('convertit les non-chaînes en string', () => {
        expect(sanitize(42)).toBe('42')
        expect(sanitize(true)).toBe('true')
    })

    it('laisse le texte normal intact', () => {
        expect(sanitize('Jean Tremblay')).toBe('Jean Tremblay')
    })
})
