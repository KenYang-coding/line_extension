import { defineConfig } from '@rsbuild/core'

export default defineConfig({
  source: {
    entry: {
      index: './src/content-scripts/line/index.ts',
    },
  },
  output: {
    distPath: {
      root: 'chrome/content-scripts/line',
      js: '',
    },
    filename: {
      js: '[name].js',
    },
    assetPrefix: './',
    minify: false,
  },
  tools: {
    bundlerChain(chain) {
      chain.optimization.runtimeChunk(false)
      chain.optimization.splitChunks({ chunks: 'all', minSize: 0, cacheGroups: { default: false } })
    },
  },
})
