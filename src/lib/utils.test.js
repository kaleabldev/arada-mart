import { describe, it, expect } from 'vitest'
import { getDaysUntilExpiration, formatPrice, truncateText } from './utils'

describe('getDaysUntilExpiration', () => {
  it('should return positive days for future dates', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    const result = getDaysUntilExpiration(futureDate.toISOString())
    expect(result).toBe(5)
  })

  it('should return 0 for today', () => {
    const today = new Date()
    const result = getDaysUntilExpiration(today.toISOString())
    expect(result).toBe(0)
  })

  it('should return negative days for past dates', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 3)
    const result = getDaysUntilExpiration(pastDate.toISOString())
    expect(result).toBe(-3)
  })

  it('should calculate 30 days correctly', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const result = getDaysUntilExpiration(futureDate.toISOString())
    expect(result).toBe(30)
  })
})

describe('formatPrice', () => {
  it('should format price in ETB', () => {
    const result = formatPrice(25000)
    expect(result).toContain('ETB')
    expect(result).toContain('25,000')
  })

  it('should handle small prices', () => {
    const result = formatPrice(100)
    expect(result).toContain('ETB')
    expect(result).toContain('100')
  })

  it('should handle large prices', () => {
    const result = formatPrice(1000000)
    expect(result).toContain('ETB')
    expect(result).toContain('1,000,000')
  })
})

describe('truncateText', () => {
  it('should return original text if shorter than max', () => {
    const result = truncateText('Hello', 10)
    expect(result).toBe('Hello')
  })

  it('should truncate text longer than max', () => {
    const result = truncateText('Hello World', 5)
    expect(result).toBe('Hello...')
  })

  it('should handle empty string', () => {
    const result = truncateText('', 10)
    expect(result).toBe('')
  })
})
