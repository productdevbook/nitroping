import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path)
    return ''

  if (path.startsWith('http://') || path.startsWith('https://'))
    return path

  return `https://nitroping.dev/${path}`
}
