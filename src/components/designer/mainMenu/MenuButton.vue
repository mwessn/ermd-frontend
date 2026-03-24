<template>
    <div
      class="flex flex-col justify-between
        w-full max-w-42 aspect-square p-6
        rounded-tl-lg
        border border-l-accentGray border-t-accentGray
        border-r-backgroundDark border-b-backgroundDark
        active:border-l-backgroundDark active:border-t-backgroundDark
        active:border-r-accentGray active:border-b-accentGray
        text-textColor text-lg cursor-default select-none"
      @click="emit('click')"
    >
      <FontAwesomeIcon
        :icon="icon"
        class="self-start text-monolithicCyanTsunami"
        size="2x"
      />
      <div class="self-end text-left">
        {{ label }}
      </div>
    </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

defineProps<{
  icon: IconDefinition;
  label: string;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>
