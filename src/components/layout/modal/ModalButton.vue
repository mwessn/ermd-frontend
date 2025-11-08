<template>
  <div
      class="rounded p-2
          bg-monolithicCyanTsunami text-lycheeIce select-none"
      :class="disabled ?
                'grayscale-100 cursor-default' :
                'hover:opacity-80 active:opacity-50 cursor-pointer'"
  >
    {{ label }}
  </div>
</template>

<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});
</script>