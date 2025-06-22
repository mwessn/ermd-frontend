import { createApp } from 'vue'
import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from '@/App.vue'

import '@/styles/style.css'

import { router } from "@/router.ts";
import i18n from "@/utils/i18n.ts";

import { appConfig } from "@/app.config.ts";
import { useDesignStore } from "@/store/design.ts";

// Clear outdated design states if any exist
const storeSuffix = '__design';
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('__ermd_') &&
        key.endsWith(storeSuffix) &&
        !key.startsWith(`__ermd_${appConfig.appVersion}`)) {
        localStorage.removeItem(key);
    }
});

const pinia = createPinia();

pinia.use(piniaPluginPersistedstate)

const app = createApp(App);

app.config.errorHandler = (err, instance, info) => {
    console.warn('Something terrible has happened', err, info)
    useDesignStore().createNewProject();
}

app.use(router);
app.use(i18n);
app.use(pinia);

app.mount('#app');
