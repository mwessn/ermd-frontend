<template>
  <div class="bg-accentDarkGray border-2 border-backgroundDark text-accentGray rounded text-sm w-6 h-6">
    {{ text }}
  </div>
</template>

<script setup lang="ts">
defineProps({
  text: {
    type: String,
    required: true
  }
});
</script>