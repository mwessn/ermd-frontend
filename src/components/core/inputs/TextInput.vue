<template>
  <div class="flex items-center gap-3 justify-between
              p-2 bg-backgroundDark rounded-lg my-2"
  >
    <p class="cursor-default text-textColor">{{ label }}</p>
    <input
        v-model="model"
        class="p-2 rounded bg-lycheeIce min-w-3/4"
        type="text"
    >
  </div>
</template>

<script setup lang="ts">
const model = defineModel({ type: String, required: true });

defineProps({
  label: {
    type: String,
    required: true,
  }
});
</script>