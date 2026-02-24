/**
 * Simple {{variable}} template renderer.
 * Replaces `{{key}}` placeholders with values from the `vars` object.
 * Missing keys are left as empty string.
 */
export function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (_match, key: string) => {
    const trimmed = key.trim()
    const value = trimmed.split('.').reduce<unknown>((acc, part) => {
      if (acc != null && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part]
      }
      return undefined
    }, vars)

    return value != null ? String(value) : ''
  })
}
