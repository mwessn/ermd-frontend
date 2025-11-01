<template>
  <div class="p-2 border-l border-l-accentDarkGray grid gap-2">
    <p class="wrap-break-word max-w-16">{{ $t(label) }}</p>
    <input
        v-model="model"
        class="self-end"
        type="checkbox"
        :name="label"
        :disabled="disabled"
        @change="emit('change')"
    >
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['change']);

const model = defineModel({
  type: Boolean,
  required: true
});

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