<template>
  <router-view />
</template>

<script setup lang="ts">
import { onBeforeMount, watch } from "vue";
import { useRoute } from "vue-router";
import { appConfig } from "@/app.config.ts";
import { useI18n } from "vue-i18n";

const i18n = useI18n();
const route = useRoute();

watch(i18n.locale, (value: string) => {
  document.querySelector('html')!.setAttribute('lang', value)
});

onBeforeMount(() => {
  document.title = `${ appConfig.appName } – ${ i18n.t(route.meta.title as string) }`;
});
</script>

<style scoped>
</style>
