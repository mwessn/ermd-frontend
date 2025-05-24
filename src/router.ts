import Main from "@/views/Main.vue";
import { createMemoryHistory, createRouter } from "vue-router";

const routes = [
    { path: '/', component: Main, meta: { title: 'Main' } },
];

export const router = createRouter({
    history: createMemoryHistory(),
    routes,
});