export type ImageSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export function getImageUrl(src: string | null | undefined, _size: ImageSize = 'md'): string | undefined {
  if (!src)
    return undefined
  return src
}
