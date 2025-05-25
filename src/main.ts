import { createApp } from 'vue'
import '@/styles/style.css'
import App from '@/App.vue'
import { router } from "@/router.ts";
import i18n from "@/utils/i18n.ts";
import { createPinia } from "pinia";

const pinia = createPinia();
const app = createApp(App);

app.use(router);
app.use(i18n);
app.use(pinia);

app.mount('#app');
