<template>
    <ModalLayout
      :modal-name="$t('criticalError.title')"
      persistent
      @close="() => {}"
    >
      <div class="my-4 text-accentDarkGray">
        <p class="cursor-default">
          {{ $t('criticalError.body') }}
        </p>

        <details class="mt-4">
          <summary class="cursor-pointer select-none font-bold">
            {{ $t('criticalError.errorDetails') }}
          </summary>
          <pre class="mt-2 p-3 bg-lycheeIce rounded text-sm overflow-auto max-h-48">{{ errorText }}</pre>
        </details>
      </div>

      <div class="w-full flex gap-3 justify-end">
        <ModalButton
          :label="$t('criticalError.exportJson')"
          @click="onExport"
        />
        <ModalButton
          :label="$t('criticalError.clearProject')"
          @click="onClear"
        />
      </div>
    </ModalLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ModalLayout from "@/components/layout/ModalLayout.vue";
import ModalButton from "@/components/layout/modal/ModalButton.vue";
import { useSettingsStore } from "@/store/settings.ts";
import { useDesignStore } from "@/store/design.ts";
import { useExportStore } from "@/store/export.ts";

const settingsStore = useSettingsStore();
const designStore = useDesignStore();
const exportStore = useExportStore();

const errorText = computed(() => {
  const err = settingsStore.criticalError;
  if (!err) return '';
  return `${err.datetime}\n${err.message}\n${err.stack ?? ''}`;
});

const onExport = () => {
  exportStore.exportProjectJson();
};

const onClear = () => {
  designStore.createNewProject();
  settingsStore.clearCriticalError();
};
</script>
