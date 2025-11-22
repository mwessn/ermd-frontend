<template>
  <CustomSelect
      v-model="currentValue"
      :label="$t('Database Engine')"
      :options="engineSelectOptions"
      @change="onDatabaseEngineChange"
  />

  <teleport to="body">
    <YesNoModal
        v-if="showEngineChangeModal"
        :modal-title="$t('Changing Database Engine')"
        :body-text="$t(ERMDMessages.dbTypeChange)"
        @close="onEngineChangeModalClose"
    />
  </teleport>
</template>

<script setup lang="ts">
import CustomSelect from "@/components/core/inputs/CustomSelect.vue";
import { type PropType, ref } from "vue";
import { type DatabaseEngine, DatabaseEngines, EngineNamingMap } from "@/types/TableColumnTypes/tableField.ts";
import { cloneDeep } from "lodash";
import { storeToRefs } from "pinia";
import { useDesignStore } from "@/store/design.ts";
import type { SelectOption } from "@/types/misc.ts";
import YesNoModal from "@/components/layout/modal/YesNoModal.vue";
import { ERMDMessages } from "@/types/messages.ts";

const props = defineProps({
  initValue: {
    type: String as PropType<DatabaseEngine>,
    required: true,
  }
})

const currentValue = ref<DatabaseEngine>(cloneDeep(props.initValue));

const emit = defineEmits(['engineChange']);

const { tables } = storeToRefs(useDesignStore());

const engineSelectOptions: SelectOption[] = DatabaseEngines.map(e => {
  return {
    value: e,
    label: EngineNamingMap[e]
  }
});

const showEngineChangeModal = ref<boolean>(false);

const onDatabaseEngineChange = () => {
  if (tables.value.length > 0) {
    showEngineChangeModal.value = true;
  } else {
    emit('engineChange', currentValue.value);
  }
}

const onEngineChangeModalClose = (val: boolean | undefined) => {
  if (val) {
    emit("engineChange", val);
  } else {
    currentValue.value = props.initValue;
  }
  showEngineChangeModal.value = false;
}
</script>