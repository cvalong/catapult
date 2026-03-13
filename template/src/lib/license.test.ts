import { describe, it, expect } from 'vitest'
import { generateKey } from './license'

describe('generateKey', () => {
  it('matches the expected format', () => {
    const key = generateKey()
    expect(key).toMatch(/^CTPLT-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/)
  })

  it('produces distinct values across 100 calls', () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateKey()))
    expect(keys.size).toBeGreaterThan(1)
  })
})
