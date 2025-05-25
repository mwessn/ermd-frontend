<template>
  <div class="relative group">
    <slot />

    <span class="absolute top-0 left-10 p-2 w-max
     cursor-default select-none
   bg-accentGray text-accentDarkGray
     hidden group-hover:block"
    >
      {{ $t(text) }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps({
  text: {
    type: String,
    required: true
  }
})
</script>

<style scoped>

</style>