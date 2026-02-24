<template>
    <template v-if="isMobile">
      <MobileView />
    </template>
    <template v-else>
      <AppLayout>
        <router-view />
      </AppLayout>

      <div
          class="absolute bottom-4 right-4 z-9999"
      >
        <transition-group name="list">
          <div
              v-for="message in notificationStore.messages"
              class="p-2 rounded m-2 max-w-96 font-bold flex items-center justify-between gap-3"
              :key="message.id"
              :class="[{ 'bg-notificationMessage' : message.type == 'success' },
          { 'bg-warningMessage' : message.type == 'warning' },
          { 'bg-errorMessage' : message.type == 'error' }]"
          >
            <p class="w-full break-words whitespace-pre-wrap overflow-hidden">{{ message.text }}</p>
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
import MobileView from "@/views/MobileView.vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import { useNotificationStore } from "@/store/ui/notifications.ts";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const i18n = useI18n();
const route = useRoute();

const isMobile = computed(() => window.innerWidth <= 768);

const notificationStore = useNotificationStore();

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
</script>

<style scoped>
</style>
