<template>
  <div
      class="p-1 w-full max-w-36 not-last:border-r border-r-accentDarkGray text-center"
  >
    <p>
      {{ $t(mod.hint) }}
    </p>
    <div class="border-b border-b-accentDarkGray my-1" />
    <div class="flex items-center gap-1">
      <p v-if="mod.meta == 'enumList'">
        [
      </p>
      <input
          class="w-full text-center"
          v-model="model"

          :type="modifierInputType"

          placeholder="null"

          :min="mod.minValue"
          :max="mod.maxValue"

          :name="mod.hint"

          :title="mod.hint"

          @change="emit('change')"
      >
      <p v-if="mod.meta == 'enumList'">
        ]
      </p>
      <FontAwesomeIcon
          v-if="mod.optional"
          class="cursor-pointer hover:opacity-50 ml-1"
          :icon="faClose"
          @click="emit('removeValue')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { computed, type PropType } from "vue";
import type { ColumnTypeModifier } from "@/types/TableColumnTypes/tableField.ts";

const model = defineModel<string | number | undefined>({
  type: [String, Number] as const,
  required: false
});

const props = defineProps({
  mod: {
    type: Object as PropType<ColumnTypeModifier>,
    required: true
  }
});

const emit = defineEmits(['change', 'removeValue']);

const modifierInputType = computed(() => {
  if (props.mod.meta == 'inputNumber') {
    return 'number';
  }

  switch (typeof props.mod.defaultValue) {
    case 'number':
      return 'number'
    case 'string':
      return 'string';
    default:
      return 'string';
  }
});

</script>