<template>
    <ModalLayout :modal-name="$t('modal.importJson')" @close="emit('close', false)">
      <div class="my-4">
        <FileUpload
          @on-file-change="onFileChange"
        />
      </div>

      <template v-if="importErrors">
        <div
          class="text-red-500 max-h-64
          overflow-y-auto
          p-2 bg-accentDarkGray rounded mb-2 select-text"
        >
          <p>{{ $t('import.errors') }}:</p>
          <p v-for="(error, index) in importErrors" :key="index">
            {{ error }}
          </p>
        </div>
      </template>

      <div class="w-full flex gap-3 justify-end">
        <ModalButton
          :label="$t('common.import')"
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
    importErrors.value == undefined);

const onFileChange = (_file: File | undefined) => {
  importErrors.value = undefined;
  file.value = _file;
};

const onImport = async () => {
  if (file.value) {
    try {
      importErrors.value = await exportStore.importProjectJson(file.value);

      if (importErrors.value == undefined) {
        emit('close', true);
      }
    }
    catch (e: unknown) {
      importErrors.value = [String(e)];
    }
  }
};

</script>
