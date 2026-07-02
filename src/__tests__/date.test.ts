import { describe, it, expect } from 'vitest'
import { today, nowISO } from '@/utils/date'

describe('today', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns today\'s date', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(today()).toBe(expected)
  })
})

describe('nowISO', () => {
  it('returns valid ISO string', () => {
    const iso = nowISO()
    expect(() => new Date(iso)).not.toThrow()
    expect(new Date(iso).toISOString()).toBe(iso)
  })
})
