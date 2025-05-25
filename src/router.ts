import Designer from "@/views/Designer.vue";
import { createMemoryHistory, createRouter } from "vue-router";

const routes = [
    { path: '/', component: Designer, meta: { title: 'Designer' } },
];

export const router = createRouter({
    history: createMemoryHistory(),
    routes,
});