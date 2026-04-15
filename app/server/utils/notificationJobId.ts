interface DeviceJobShape {
  deliveryMode: 'device'
  notificationId: string
  deviceId: string
}

interface ChannelJobShape {
  deliveryMode: 'channel'
  notificationId: string
  channelId: string
  to: string
}

// BullMQ rejects custom job ids containing ':' (used as a Redis key separator),
// throwing "Custom Id cannot contain :". Use '-' instead.
export function getSendNotificationJobId(data: DeviceJobShape | ChannelJobShape) {
  if (data.deliveryMode === 'device') {
    return `notification-${data.notificationId}-device-${data.deviceId}`
  }

  const to = data.to.replace(/:/g, '-')
  return `notification-${data.notificationId}-channel-${data.channelId}-${to}`
}
