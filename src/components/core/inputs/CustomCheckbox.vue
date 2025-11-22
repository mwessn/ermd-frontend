<template>
  <div
      class="select-none my-4"
  >
    <div
        class="bg-backgroundDark rounded-lg p-4
        flex items-center gap-3
        cursor-pointer hover:opacity-80"
        @click="toggleValue"
    >
      <div
          class="h-6 w-6 aspect-square rounded bg-lycheeIce p-1"
      >
        <div
            v-if="checked"
            class="full rounded bg-monolithicCyanTsunami"
        />
      </div>
      <p class="text-textColor">
        {{ label }}
      </p>
    </div>
    <p v-if="hint" class="text-sm text-accentGray my-2 text-left">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  hint: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  }
});

const checked = defineModel({ type: Boolean, required: true });

const toggleValue = () => {
  if (props.disabled) { return; }
  checked.value = !checked.value;
}
</script>