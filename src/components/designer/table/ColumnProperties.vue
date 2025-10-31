<template>
  <div
      class="absolute left-full bottom-0
        bg-accentGray text-sm z-90
        rounded-r-lg rounded-tl-lg"
  >
    <div v-if="col.type.modifier && col.modifierValues" class="flex justify-center border-b border-b-accentDarkGray">
      <div
          v-for="(mod, index) in col.type.modifier"
          class="p-1 w-full max-w-36 not-last:border-r border-r-accentDarkGray text-center"
      >
        <p>
          {{ $t(mod.hint) }}
        </p>
        <div class="border-b border-b-accentDarkGray my-1" />
        <input
            class="w-full text-center"
            v-model="col.modifierValues[index]"

            placeholder="null"

            :min="mod.minValue"
            :max="mod.maxValue"

            :name="mod.hint"

            :title="mod.hint"
        >
      </div>
    </div>

    <div class="flex text-center">
      <ColPropertyCheckbox
          v-model="col.primaryKey"
          label="PK"
          :disabled="!colCanBePrimary(col)"
      />
      <ColPropertyCheckbox
          v-model="col.notNull"
          label="NN"
          :disabled="!colCanBeNullable(col)"
      />
      <ColPropertyCheckbox
          v-model="col.unique"
          label="U"
      />
      <ColPropertyCheckbox
          v-model="col.autoIncrement"
          label="AI"
          :disabled="!colCanAutoIncrement(col) || col.primaryKey"
      />

      <div class="p-2 border-l border-l-accentDarkGray grid gap-2 w-16">
        <p class="wrap-break-word w-12">{{ $t('Default') }}</p>
        <input
            v-model="col.defaultValue"
            placeholder="none"
            class="self-end border-b text-center w-12"
            type="text"
            name="column default value"
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { colCanAutoIncrement, colCanBeNullable, colCanBePrimary, type TableCol } from "@/types/table.ts";
import ColPropertyCheckbox from "@/components/designer/table/ColPropertyCheckbox.vue";
import { computed, type PropType } from "vue";

const props = defineProps({
  col: {
    type: Object as PropType<TableCol>,
    required: true
  },
});

const defaultInputType = computed(() => {

});
</script>