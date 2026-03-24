<template>
    <CustomSelect
      v-model="currentValue"
      :label="$t('settings.databaseEngine')"
      :options="engineSelectOptions"
      @change="onDatabaseEngineChange"
    />

    <teleport to="body">
      <YesNoModal
        v-if="showEngineChangeModal"
        :modal-title="$t('modal.changingDatabaseEngine')"
        :body-text="$t('messages.dbTypeChange')"
        @close="onEngineChangeModalClose"
      />
    </teleport>
</template>

<script setup lang="ts">
import CustomSelect from "@/components/core/inputs/CustomSelect.vue";
import { ref } from "vue";
import { type DatabaseEngine, DatabaseEngines, EngineNamingMap } from "@/types/TableColumnTypes/tableField.ts";
import { cloneDeep } from "lodash-es";
import { storeToRefs } from "pinia";
import { useDesignStore } from "@/store/design.ts";
import type { SelectOption } from "@/types/misc.ts";
import YesNoModal from "@/components/layout/modal/YesNoModal.vue";

const props = defineProps<{
  initValue: DatabaseEngine
}>();

const currentValue = ref<DatabaseEngine>(cloneDeep(props.initValue));

const emit = defineEmits(['engineChange']);

const { tables } = storeToRefs(useDesignStore());

const engineSelectOptions: SelectOption[] = DatabaseEngines.map(e => {
  return {
    value: e,
    label: EngineNamingMap[e]
  };
});

const showEngineChangeModal = ref<boolean>(false);

const onDatabaseEngineChange = () => {
  if (tables.value.length > 0) {
    showEngineChangeModal.value = true;
  } else {
    emit('engineChange', currentValue.value);
  }
};

const onEngineChangeModalClose = (val: boolean | undefined) => {
  if (val) {
    emit("engineChange", currentValue.value);
  } else {
    currentValue.value = props.initValue;
  }
  showEngineChangeModal.value = false;
};
</script>