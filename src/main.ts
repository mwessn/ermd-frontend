import { createApp } from 'vue'
import '@/styles/style.css'
import App from '@/App.vue'
import { router } from "@/router.ts";
import { createI18n } from "vue-i18n";

// Locales
import en from "@/locale/en.json";

const app = createApp(App);

const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {
        en,
    }
});

app.use(router);
app.use(i18n);

app.mount('#app');
