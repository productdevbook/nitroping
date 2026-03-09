export type NotificationLifecycleStatus
  = | 'PENDING'
    | 'QUEUED'
    | 'PROCESSING'
    | 'SENT'
    | 'DELIVERED'
    | 'FAILED'
    | 'PARTIAL'
    | 'SCHEDULED'

export function getNotificationTerminalStatus(
  totalTargets: number,
  totalSent: number,
  totalFailed: number,
): NotificationLifecycleStatus | null {
  if (totalTargets <= 0) {
    return 'SENT'
  }

  if (totalSent + totalFailed < totalTargets) {
    return null
  }

  if (totalFailed === 0) {
    return 'SENT'
  }

  if (totalSent === 0) {
    return 'FAILED'
  }

  return 'PARTIAL'
}
