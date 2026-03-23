<template>
    <template v-if="isMobile">
      <MobileView />
    </template>
    <template v-else>
      <CriticalErrorModal v-if="criticalError" />

      <AppLayout>
        <router-view />
      </AppLayout>

      <div
        class="absolute bottom-4 right-4 z-9999"
      >
        <transition-group name="list">
          <div
            v-for="message in notificationStore.messages"
            :key="message.id"
            class="p-2 rounded m-2 max-w-96 font-bold flex items-center justify-between gap-3"
            :class="[{ 'bg-notificationMessage' : message.type == 'success' },
                     { 'bg-warningMessage' : message.type == 'warning' },
                     { 'bg-errorMessage' : message.type == 'error' }]"
          >
            <p class="w-full break-words whitespace-pre-wrap overflow-hidden">
              {{ message.text }}
            </p>
            <FontAwesomeIcon
              :icon="faClose"
              class="h-3 cursor-pointer"
              @click="notificationStore.hide(message.id)"
            />
          </div>
        </transition-group>
      </div>
    </template>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import { appConfig } from "@/app.config.ts";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import MobileView from "@/views/MobileView.vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import CriticalErrorModal from "@/components/layout/modal/CriticalErrorModal.vue";
import { useNotificationStore } from "@/store/ui/notifications.ts";
import { useSettingsStore } from "@/store/settings.ts";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { type AppLocale, APP_LOCALES } from "@/types/misc.ts";

const i18n = useI18n();
const route = useRoute();

const isMobile = computed(() => window.innerWidth <= 768);

const notificationStore = useNotificationStore();
const settingsStore = useSettingsStore();
const { criticalError } = storeToRefs(settingsStore);

// Allow ?lang= URL param to override locale (for crawlers)
const urlLang = new URLSearchParams(window.location.search).get('lang');
if (urlLang && APP_LOCALES.includes(urlLang as AppLocale)) {
  i18n.locale.value = urlLang as AppLocale;
} else {
  i18n.locale.value = settingsStore.currentSettings.language;
}

watch(
  () => i18n.locale,
  (value) => {
    document.querySelector('html')?.setAttribute('lang', value.value);
  },
  { immediate: true }
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

// Meta description for search engines, reactive to locale
function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setHreflangLinks() {
  // Remove old hreflang links
  document.querySelectorAll('link[hreflang]').forEach(el => el.remove());

  const base = window.location.origin + window.location.pathname;
  for (const locale of APP_LOCALES) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', locale);
    link.setAttribute('href', `${base}?lang=${locale}`);
    document.head.appendChild(link);
  }
}

watch(
  () => i18n.locale.value,
  () => {
    setMeta('description', `${appConfig.appName} — ${i18n.t('mainMenu.description')}`);
    setHreflangLinks();
  },
  { immediate: true }
);
</script>

<style scoped>
</style>
