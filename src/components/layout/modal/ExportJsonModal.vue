<template>
  <ModalLayout :modal-name="$t('Export JSON')" @close="emit('close')">
    <div class="my-4 flex gap-4 items-center text-accentDarkGray">
      <div>
        <p class="cursor-default">{{ $t('Project name') }}</p>
        <input
            v-model="projectName"
            class="p-2 rounded bg-lycheeIce"
            type="text"
        >
      </div>
      <div>
        <div class="flex items-center gap-2 cursor-default">
          <p>{{ $t('Project version') }}</p>
          <p class="text-tinted">({{ $t('Optional') }})</p>
        </div>
        <input
            v-model="projectVersion"
            class="p-2 rounded bg-lycheeIce"
            type="text"
        >
      </div>
    </div>

    <div class="w-full flex gap-3 justify-end">
      <div
          class="rounded p-2 cursor-pointer
          bg-lycheeIce text-accentDarkGray
          hover:opacity-80 active:opacity-50"
          @click="onExportClick"
      >
        {{ $t('Export') }}
      </div>
    </div>
  </ModalLayout>
</template>

<script setup lang="ts">
import ModalLayout from "@/components/layout/ModalLayout.vue";
import { useExportStore } from "@/store/export.ts";
import { storeToRefs } from "pinia";

const emit = defineEmits(['close']);

const exportStore = useExportStore();

const {
    projectName,
    projectVersion
} = storeToRefs(exportStore);

const onExportClick = () => {
  exportStore.exportProjectJson();

  emit('close');
}
</script>