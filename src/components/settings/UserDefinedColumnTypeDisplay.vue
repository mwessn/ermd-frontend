<template>
    <div class="w-full max-h-96 overflow-hidden border border-backgroundDark rounded-lg p-1">
      <div class="full overflow-auto">
        <p class="text-accentGray mb-2">
          {{ $t('Custom column types') }}
        </p>
        <!--   Button   -->
        <div
          class="flex items-center justify-center gap-2
                  p-1 bg-accentGray rounded text-accentDarkGray
                  hover:opacity-80 active:opacity-50
                  cursor-pointer select-none"
          @mouseup.left="customTypeModalVisible = true"
        >
          <FontAwesomeIcon :icon="faPlusCircle" />
          <p>{{ $t('Add') }}</p>
        </div>
        <!--   Types   -->
        <template v-for="type in userDefinedColumnTypes" :key="type.displayName">
          <div
            class="w-full flex justify-between items-center p-2 my-2 border-b border-b-accentGray"
          >
            <div class="text-left">
              {{ type.displayName }}
            </div>
            <div class="flex items-center gap-3">
              <FontAwesomeIcon :icon="faPencilSquare" class="cursor-pointer hover:opacity-80" />
              <FontAwesomeIcon :icon="faTrashCan" class="cursor-pointer hover:opacity-80" />
            </div>
          </div>
        </template>
      </div>

      <teleport to="body">
        <CustomTypeModal
          v-if="customTypeModalVisible"
          :edited-type="currentEditType"
          @close="onModalClose"
        />
      </teleport>
    </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/store/settings.ts";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faPencilSquare, faPlusCircle, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { ref } from "vue";
import type { ColumnType } from "@/types/TableColumnTypes/tableField.ts";
import CustomTypeModal from "@/components/layout/modal/CustomTypeModal.vue";

const { userDefinedColumnTypes } = storeToRefs(useSettingsStore());

const currentEditType = ref<ColumnType | undefined>(undefined);

const customTypeModalVisible = ref<boolean>(false);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onModalClose = (_val: ColumnType | undefined): void => {
  customTypeModalVisible.value = false;
};
</script>