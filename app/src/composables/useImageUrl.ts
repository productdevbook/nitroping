export type ImageSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export function getImageUrl(src: string | null | undefined, _size: ImageSize = 'md'): string | undefined {
  if (!src)
    return undefined

  if (src.startsWith('http://') || src.startsWith('https://'))
    return src

  return `https://nitroping.dev/${src}`
}
