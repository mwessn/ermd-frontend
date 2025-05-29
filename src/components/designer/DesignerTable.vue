<template>
  <div
      class="w-40 absolute z-10 group focus:z-20"
      tabindex="-1"
      :style="{ top: table.posY + 'px', left: table.posX + 'px' }"
      @focus="selectTable(table)"
      @focusout="selectTable()"
  >
    <div class="w-full h-4 bg-accentDarkGray radial-accentGray z-20" />
    <div class="z-20 bg-accentGray rounded-b-lg">
      <div class="w-full border-b border-b-accentDarkGray" @mousedown.left.stop>
        <input
            v-model="table.name"
            class="w-full p-2"
            type="text"
            tabindex="-1"
        >
      </div>
      <div class="w-full p-4">

      </div>
    </div>

    <!--    Pseudo border   -->
    <div class="absolute w-[104%] h-[104%] z-[-1] top-0 -right-[2%] rounded-b-xl
     bg-transparent group-hover:bg-lycheeIce group-focus:bg-monolithicCyanTsunami"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { Table } from "@/types/table.ts";
import { useDesignStore } from "@/store/design.ts";

defineProps({
  table: {
    type: Object as PropType<Table>,
    required: true
  }
});

const { selectTable } = useDesignStore();
</script>