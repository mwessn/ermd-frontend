import { createApp } from 'vue'
import '@/styles/style.css'
import App from '@/App.vue'
import { router } from "@/router.ts";
import i18n from "@/utils/i18n.ts";

const app = createApp(App);

app.use(router);
app.use(i18n);

app.mount('#app');
