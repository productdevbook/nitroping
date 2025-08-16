import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      '.github',
      '.output',
      '.nitro',
      '.nuxt',
      'dist',
      'app/components/ui',
      'server/database/migrations',
      '*.md',
      'docs',
      'scripts',
      '.claude',
      'CLAUDE.md',
    ],
  },
  {
    rules: {
      'node/prefer-global/process': 'off',
      // Vue template formatting rules - more flexible
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'no-console': 'off',
    },
  },
)
