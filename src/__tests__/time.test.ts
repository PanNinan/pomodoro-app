import { describe, it, expect } from 'vitest'
import { formatTime, formatDuration, minutesToSeconds, secondsToMinutes } from '@/utils/time'

describe('formatTime', () => {
  it('formats 25 minutes as 25:00', () => {
    expect(formatTime(1500)).toBe('25:00')
  })

  it('formats 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00')
  })

  it('formats 65 seconds as 01:05', () => {
    expect(formatTime(65)).toBe('01:05')
  })

  it('formats 59 seconds as 00:59', () => {
    expect(formatTime(59)).toBe('00:59')
  })

  it('formats 3600 seconds (1 hour) as 60:00', () => {
    expect(formatTime(3600)).toBe('60:00')
  })
})

describe('formatDuration', () => {
  it('formats 1500 seconds as 25分钟', () => {
    expect(formatDuration(1500)).toBe('25分钟')
  })

  it('formats 3600 seconds as 1小时', () => {
    expect(formatDuration(3600)).toBe('1小时')
  })

  it('formats 5400 seconds as 1小时30分钟', () => {
    expect(formatDuration(5400)).toBe('1小时30分钟')
  })

  it('formats 0 seconds as 0分钟', () => {
    expect(formatDuration(0)).toBe('0分钟')
  })
})

describe('minutesToSeconds / secondsToMinutes', () => {
  it('converts 25 minutes to 1500 seconds', () => {
    expect(minutesToSeconds(25)).toBe(1500)
  })

  it('converts 1500 seconds to 25 minutes', () => {
    expect(secondsToMinutes(1500)).toBe(25)
  })

  it('rounds down partial minutes', () => {
    expect(secondsToMinutes(90)).toBe(1) // 1.5 → 1
  })
})
