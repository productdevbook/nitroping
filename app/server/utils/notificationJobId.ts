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

export function getSendNotificationJobId(data: DeviceJobShape | ChannelJobShape) {
  if (data.deliveryMode === 'device') {
    return `notification:${data.notificationId}:device:${data.deviceId}`
  }

  return `notification:${data.notificationId}:channel:${data.channelId}:${data.to}`
}
