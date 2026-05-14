import { defineConfig, loadEnv } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'
import { pluginLess } from '@rsbuild/plugin-less'

const { publicVars } = loadEnv({ prefixes: ['PUBLIC_'] })

export default defineConfig({
  plugins: [
    pluginVue(),
    pluginLess({
      lessLoaderOptions: {
        lessOptions: {
          javascriptEnabled: true,
        },
      },
    }),
  ],
  server: {
    port: 3100,
  },
  html: {
    template: './public/index.html',
  },
  resolve: {
    alias: {
      '@': './src',
      '~': './',
    },
  },
  output: {
    distPath: {
      root: 'chrome/side_panel',
    },
    assetPrefix: './',
  },
  source: {
    entry: {
      index: './src/main.ts',
    },
    define: publicVars,
  },
  environments: {
    web: {
      output: {
        distPath: {
          root: 'chrome/side_panel',
        },
      },
    },
  },
})
