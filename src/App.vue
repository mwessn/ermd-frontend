<template>
  <template v-if="isMobile">
    <Mobile />
  </template>
  <template v-else>
    <router-view />
  </template>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import { appConfig } from "@/app.config.ts";
import { useI18n } from "vue-i18n";
import Mobile from "@/views/Mobile.vue";

const i18n = useI18n();
const route = useRoute();

const isMobile = computed(() => window.innerWidth <= 768);

watch(
    () => i18n.locale,
    (value) => {
      document.querySelector('html')!.setAttribute('lang', value.value)
    },
    {immediate: true}
);

watch(
    () => route.meta?.title,
    (newTitle) => {
      if (newTitle) {
        document.title = `${ appConfig.appName } – ${ i18n.t(newTitle as string) }`;
      }
    },
    { immediate: true }
);
</script>

<style scoped>
</style>
