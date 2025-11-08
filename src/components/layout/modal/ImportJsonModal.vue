<template>
  <ModalLayout :modal-name="$t('Import JSON')" @close="emit('close')">
    <div class="my-4">
      <FileUpload
        @onFileChange="onFileChange"
      />
    </div>

    <template v-if="importErrors">
      <div class="text-red-500 max-h-64
          overflow-hidden overscroll-y-auto
          p-2 bg-accentDarkGray rounded mb-2"
      >
        <p>{{ $t('Import errors') }}:</p>
        <p v-for="error in importErrors">
          {{ error }}
        </p>
      </div>
    </template>

    <div class="w-full flex gap-3 justify-end">
      <ModalButton
          :label="$t('Import')"
          :disabled="!canSave"
          @click="onImport"
      />
    </div>
  </ModalLayout>
</template>

<script setup lang="ts">
import ModalLayout from "@/components/layout/ModalLayout.vue";
import { useExportStore } from "@/store/export.ts";
import { computed, ref } from "vue";
import FileUpload from "@/components/layout/modal/FileUpload.vue";
import ModalButton from "@/components/layout/modal/ModalButton.vue";

const emit = defineEmits(['close']);

const exportStore = useExportStore();

const importErrors = ref<string[] | undefined>(undefined);

const file = ref<File | undefined>(undefined);

const canSave = computed(() =>
    file.value != undefined &&
    importErrors.value == undefined
);

const onFileChange = (_file: File | undefined) => {
  importErrors.value = undefined;
  file.value = _file;
}

const onImport = async () => {
  if (file.value) {
    try {
      importErrors.value = await exportStore.importProjectJson(file.value);

      if (importErrors.value == undefined) {
        emit('close');
      }
    }
    catch (e: any) {
      importErrors.value = [e.toString];
    }
  }
}

</script>

<style scoped>

</style>