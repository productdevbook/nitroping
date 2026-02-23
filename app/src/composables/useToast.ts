import { readonly, ref } from 'vue'

interface ToastMessage {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const toasts = ref<ToastMessage[]>([])

export function useToast() {
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const toast = (message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 15)
    const duration = message.duration || 5000

    const toastMessage: ToastMessage = {
      ...message,
      id,
    }

    toasts.value.push(toastMessage)

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const success = (title: string, description?: string) => {
    return toast({ title, description, type: 'success' })
  }

  const error = (title: string, description?: string) => {
    return toast({ title, description, type: 'error' })
  }

  const warning = (title: string, description?: string) => {
    return toast({ title, description, type: 'warning' })
  }

  const info = (title: string, description?: string) => {
    return toast({ title, description, type: 'info' })
  }

  return {
    toasts: readonly(toasts),
    toast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}
