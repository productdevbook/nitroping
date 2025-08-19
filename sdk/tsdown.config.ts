import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm'],
  dts: true,
  clean: true,
  minify: true,
  target: 'es2020',
  platform: 'browser',
  outDir: 'dist',
  external: [],
  unbundle: true,
})
