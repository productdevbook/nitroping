import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  formatters: false,
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': 'off',
  },
  ignores: [
    'src/components/ui/**',
  ],
})
