import { createApp } from 'vue'
import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from '@/App.vue'

import '@/styles/style.css'

import { router } from "@/router.ts";
import i18n from "@/utils/i18n.ts";

import { useDesignStore } from "@/store/design.ts";

const pinia = createPinia();

pinia.use(piniaPluginPersistedstate)

const app = createApp(App);

app.config.errorHandler = (err) => {
    console.warn('Something terrible has happened', err)
    useDesignStore().createNewProject();
}

app.use(router);
app.use(i18n);
app.use(pinia);

app.mount('#app');
