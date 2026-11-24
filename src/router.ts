import DesignerView from "@/views/DesignerView.vue";
import { createMemoryHistory, createRouter } from "vue-router";

const routes = [
  { path: '/', component: DesignerView, meta: { title: 'Designer' } },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});