<template>
  <div class="flex items-center justify-between relative
              p-2 bg-backgroundDark rounded-lg my-2"
  >
    <p class="cursor-default text-textColor w-1/4">{{ label }}</p>
    <input
        v-model="model"
        class="p-2 rounded bg-lycheeIce w-3/4"
        :class="uppercase ? 'uppercase' : ''"
        type="text"
        autocomplete="off"
        @focus="emit('focusInput')"
        @blur="onFocusOut"
        @keyup.tab=""
    >
    <div
        v-if="suggestion"
        class="absolute top-0 left-1/4 text-tinted pointer-events-none p-3 h-full flex items-center"
    >
      {{ suggestion }}
    </div>
  </div>
</template>

<script setup lang="ts">
const model = defineModel({ type: String, required: true });

const emit = defineEmits(['focusInput', 'blurInput']);

defineProps({
  label: {
    type: String,
    required: true,
  },
  suggestion: {
    type: String,
    default: '',
  },
  uppercase: {
    type: Boolean,
    default: false,
  }
});

const onFocusOut = (evt: FocusEvent) => {
  emit('blurInput', evt);
}
</script>