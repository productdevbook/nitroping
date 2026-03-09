import { describe, expect, it } from 'vitest'
import { getNotificationTerminalStatus } from '../server/utils/notificationStatus'

describe('getNotificationTerminalStatus', () => {
  it('returns null while deliveries are still in progress', () => {
    expect(getNotificationTerminalStatus(10, 4, 1)).toBeNull()
  })

  it('returns SENT when all targets succeeded', () => {
    expect(getNotificationTerminalStatus(5, 5, 0)).toBe('SENT')
  })

  it('returns FAILED when all targets failed', () => {
    expect(getNotificationTerminalStatus(3, 0, 3)).toBe('FAILED')
  })

  it('returns PARTIAL when both success and failure exist', () => {
    expect(getNotificationTerminalStatus(4, 3, 1)).toBe('PARTIAL')
  })
})
