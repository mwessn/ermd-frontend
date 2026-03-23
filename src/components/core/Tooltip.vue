<template>
    <div class="relative group">
      <slot />

      <div
        class="absolute bottom-0 left-full ml-2 p-2 w-max
           cursor-default select-none
         bg-accentGray text-accentDarkGray rounded-sm
           hidden group-hover:flex group-focus:flex gap-2 items-center"
      >
        <div>
          {{ $t(text) }}
        </div>
        <KeyDisplay v-if="button" :text="button" />
      </div>
    </div>
</template>

<script setup lang="ts">
import KeyDisplay from "@/components/core/KeyDisplay.vue";

defineProps<{
  text: string
  button?: string
}>();
</script>

<style scoped>

</style>