<template>
    <div
      class="bg-accentDarkGray border-2 border-backgroundDark text-accentGray
          rounded text-sm h-6 flex px-2
          justify-center items-center"
      :class="square? 'w-6' : 'px-2'"
    >
      {{ text }}
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  text: string
  square?: boolean
}>(), {
  square: true
});
</script>