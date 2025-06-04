<template>
  <div
      class="w-40 absolute z-10 group focus:z-20 focus:outline-0"
      tabindex="-1"
      ref="tableRef"
      :style="{ top: table.posY + 'px', left: table.posX + 'px' }"
      @focus="selectTable(table)"
      @focusout="selectTable()"
  >
<!--    <div class="w-full h-4 bg-accentDarkGray radial-accentGray z-20" />-->
    <div class="z-20 bg-accentGray rounded-b-lg">
      <div class="w-full border-b border-b-accentDarkGray">
        <DoubleClickFocusInput
            v-model="table.name"
            type="text"
            class="w-full p-2 bg-monolithicCyanTsunami"
            :class="{ '!bg-red-400': isDuplicate }"
            ref="nameInputRef"
            @mousedown.left="focusTable"
        />
      </div>
      <div class="w-full p-4">
        {{ table.id }}
        {{ table.posX }},
        {{ table.posY }}
      </div>
    </div>

    <!--    Pseudo border   -->
    <div class="absolute w-[104%] h-[104%] z-[-1] top-0 -right-[2%] rounded-b-xl
     bg-transparent group-hover:bg-lycheeIce group-focus:bg-monolithicCyanTsunami"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, type PropType, useTemplateRef } from "vue";
import type { Table } from "@/types/table.ts";
import { useDesignStore } from "@/store/design.ts";
import DoubleClickFocusInput from "@/components/core/DoubleClickFocusInput.vue";
import { sleep } from "@/utils/utils.ts";

const { selectTable, isManualCreation } = useDesignStore();

defineProps({
  table: {
    type: Object as PropType<Table>,
    required: true
  },
  isDuplicate: {
    type: Boolean,
    required: true
  }
});

const tableRef = useTemplateRef('tableRef');

const focusTable = () => {
  tableRef.value?.focus();
}

const nameInputRef = useTemplateRef('nameInputRef');

onMounted(async () => {
  // When a new table is created manually, focus table name input and select all content
  if (isManualCreation) {
    await sleep(50); // Sleep for a short time after mount, otherwise can't focus
    nameInputRef.value?.focusSelectAll();
  }
})
</script>