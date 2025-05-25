<template>
  <div class="relative group">
    <slot />

    <span class="absolute top-0 left-10 p-2 w-max
     cursor-default select-none
   bg-accentGray text-accentDarkGray rounded-sm
     hidden group-hover:flex gap-2 items-center"
    >
      <div>
        {{ $t(text) }}
      </div>
      <KeyDisplay v-if="button" :text="button" />
    </span>
  </div>
</template>

<script setup lang="ts">
import KeyDisplay from "@/components/core/KeyDisplay.vue";

defineProps({
  text: {
    type: String,
    required: true
  },
  button: {
    type: String,
    required: false
  }
})
</script>

<style scoped>

</style>