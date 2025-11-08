<template>
  <ModalLayout :modal-name="$t('Import JSON')" @close="emit('close')">
    <div class="my-4">
      <FileUpload
        @onFileChange="onFileChange"
      />
    </div>

    <div class="w-full flex gap-3 justify-end">
      <ModalButton
          :label="$t('Import')"
          :disabled="file == undefined"
          @click="onImport"
      />
    </div>
  </ModalLayout>
</template>

<script setup lang="ts">
import ModalLayout from "@/components/layout/ModalLayout.vue";
import { useExportStore } from "@/store/export.ts";
import { ref } from "vue";
import FileUpload from "@/components/layout/modal/FileUpload.vue";
import ModalButton from "@/components/layout/modal/ModalButton.vue";

const emit = defineEmits(['close']);

const exportStore = useExportStore();

const importErrors = ref<string[] | undefined>(undefined);

const file = ref<File | undefined>(undefined);

const onFileChange = (_file: File | undefined) => {
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
      importErrors.value = [e];
    }
  }
}

</script>

<style scoped>

</style>