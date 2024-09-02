import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  main: {
    plugins: [nxViteTsPaths() as any, externalizeDepsPlugin()],
    build: {
      target: "node12",
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/main/index.ts'),  // Assuming this is your main entry
          processSlippiFile: resolve(__dirname, '../../libs/tracker-core/src/processSlippiFile.worker.ts'),
        },
        output: {
          dir: resolve(__dirname, 'out'),
          entryFileNames: (chunk) => {
            if (chunk.name === 'main') {
              return 'main/index.js';
            }
            if (chunk.name === 'processSlippiFile') {
              return 'main/processSlippiFile.worker.js';
            }
            return '[name]/index.js'; // Default pattern
          },
          format: 'cjs'
        },
      }
    }
  },
  preload: {
    plugins: [nxViteTsPaths() as any, externalizeDepsPlugin()]
  },
  renderer: {
    build: {
      commonjsOptions: { transformMixedEsModules: true }
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src/renderer/src', import.meta.url))
      }
    },
    plugins: [nxViteTsPaths() as any, vue()]
  }
})
