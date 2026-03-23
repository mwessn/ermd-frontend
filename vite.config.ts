import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from "@tailwindcss/vite";
import path from 'path';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VueI18nPlugin({
      include: [path.resolve(__dirname, './src/locale/**')],
      compositionOnly: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router'],
          state: ['pinia', 'pinia-plugin-persistedstate'],
          i18n: ['vue-i18n'],
          ui: [
            '@fortawesome/fontawesome-svg-core',
            '@fortawesome/free-brands-svg-icons',
            '@fortawesome/free-solid-svg-icons',
            '@fortawesome/vue-fontawesome',
            'tailwindcss'
          ],
          utils: ['lodash-es']
        }
      }
    }
  },
  esbuild: {
    logLevel: 'debug',
  },
});
