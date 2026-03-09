import { describe, expect, it } from 'vitest'
import { getSendNotificationJobId } from '../server/utils/notificationJobId'

describe('getSendNotificationJobId', () => {
  it('builds deterministic ids for device jobs', () => {
    expect(getSendNotificationJobId({
      deliveryMode: 'device',
      notificationId: 'n1',
      deviceId: 'd1',
      appId: 'a1',
      platform: 'ios',
      token: 'token-1',
      payload: {
        title: 'Hello',
        body: 'World',
      },
    })).toBe('notification:n1:device:d1')
  })

  it('builds deterministic ids for channel jobs', () => {
    expect(getSendNotificationJobId({
      deliveryMode: 'channel',
      notificationId: 'n1',
      appId: 'a1',
      channelId: 'c1',
      to: 'foo@example.com',
      channelType: 'EMAIL',
      payload: {
        title: 'Hello',
        body: 'World',
      },
    })).toBe('notification:n1:channel:c1:foo@example.com')
  })
})
