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
      include: [path.resolve(import.meta.dirname, './src/locale/**')],
      compositionOnly: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    }
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vue', test: /node_modules[\\/](vue|vue-router|@vue)[\\/]/ },
            { name: 'state', test: /node_modules[\\/](pinia|pinia-plugin-persistedstate)[\\/]/ },
            { name: 'i18n', test: /node_modules[\\/](vue-i18n|@intlify)[\\/]/ },
            { name: 'ui', test: /node_modules[\\/]@fortawesome[\\/]/ },
            { name: 'utils', test: /node_modules[\\/]lodash-es[\\/]/ },
          ],
        },
      },
    },
  },
});
