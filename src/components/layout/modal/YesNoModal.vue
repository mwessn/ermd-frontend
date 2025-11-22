<template>
  <ModalLayout
      :modal-name="modalTitle"
      @close="emit('close')"
  >
    <div class="mt-4 mb-8 text-backgroundDark text-lg">
      {{ bodyText }}
    </div>

    <div class="flex justify-end">
      <div class="flex gap-3 items-center">
        <ModalButton
            class="!bg-lycheeIce !text-accentDarkGray"
            :label="cancelText"
            @click="emit('close')"
        />
        <ModalButton
            :label="confirmText"
            @click="emit('close', true)"
        />
      </div>
    </div>
  </ModalLayout>
</template>

<script setup lang="ts">

import ModalLayout from "@/components/layout/ModalLayout.vue";
import ModalButton from "@/components/layout/modal/ModalButton.vue";

defineProps({
  modalTitle: {
    type: String,
    required: true
  },
  bodyText: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  }
});

const emit = defineEmits(['close']);


</script>