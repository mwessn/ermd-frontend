<template>
  <div>
    <input
        type="file"
        ref="fileInput"
        name="json"
        accept="application/json"
        hidden
        @change="onFileChange"
    >
    <div
        v-if="!fileObj"
        class="border border-dashed border-accentGray
        bg-accentDarkGray w-full text-center text-lycheeIce py-4
         cursor-pointer select-none rounded-lg"
        @dragover.prevent
        @dragenter.prevent="handleDragEnter"
        @dragleave="handleDragLeave"
        @drop.prevent="handleDrop"
        @click="openFilePicker"
    >
      <FontAwesomeIcon :icon="faFileArrowUp" class="h-8" />
      <div class="font-bold">
        {{ $t('Drop a file here') }}
      </div>
      <div>
        {{ $t('or click to select') }}
      </div>
    </div>
    <div v-else class="flex justify-between items-center p-1.5 border-b border-b-accentGray">
      <div class="flex gap-2 items-center">
        <div class="font-bold">{{ fileObj.name }}</div>
      </div>
      <FontAwesomeIcon :icon="faTrashCan" class="cursor-pointer h-6" @click="onFileRemove" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faFileArrowUp, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { assertDefined } from "@/utils/utils.ts";

const fileObj = ref<File | undefined>(undefined);

const fileInput = useTemplateRef('fileInput');

const isDragging = ref<boolean>(false);

const _file = ref<File | undefined>(undefined);

const handleDragEnter = () => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (event: Event) => {
  isDragging.value = false;
  const droppedFiles: File[] = Array.from(
      assertDefined((event as InputEvent).dataTransfer).files
  );
  if (droppedFiles.length > 0) {
    _file.value = droppedFiles[0];
    onFileChange();
  }
};

const openFilePicker = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const onFileRemove = () => {
  fileInput.value!.value = '';
  _file.value = undefined
  fileObj.value = undefined;

  emit('onFileChange');
}

const onFileChange = async (event: Event | undefined = undefined) => {
  if (event) {
    _file.value = assertDefined(assertDefined(fileInput.value).files)[0];
  }

  fileObj.value = assertDefined(_file.value);

  emit('onFileChange', fileObj.value);
}

const emit = defineEmits(['onFileChange']);

onMounted(() => {
  fileInput.value!.focus();
});
</script>