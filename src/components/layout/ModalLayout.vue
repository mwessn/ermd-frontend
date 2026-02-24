<template>
    <div class="fixed top-0 left-0 z-999 full bg-tinted flex justify-center items-center" @click="closeModal">
      <div
        class="bg-accentGray max-w-4xl w-full max-h-4/5 overflow-y-auto p-5
        rounded-lg relative border-2 border-accentDarkGray"
        @click.stop
      >
        <div class="flex justify-between items-center border-b border-accentDarkGray">
          <div class="text-accentDarkGray font-bold text-lg cursor-default">
            {{ modalName }}
          </div>
          <div
            v-if="!persistent"
            class="cursor-pointer p-1 bg-accentGray rounded-lg"
            @click="emit('close')"
          >
            <FontAwesomeIcon :icon="faXmark" class="h-5 select-none" />
          </div>
        </div>
        <slot />
      </div>
    </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

const props = withDefaults(defineProps<{
  modalName: string
  persistent?: boolean
}>(), {
  persistent: false
});

const emit = defineEmits(['close']);

const closeModal = () => {
  if (props.persistent) return;
  emit('close');
};
</script>
