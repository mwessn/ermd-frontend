<template>
    <div
      class="fixed right-0 h-full p-4 mt-12 w-64
          bg-accentDarkGray text-center z-50
          text-textColor overflow-auto pb-24
            transition-transform duration-300"
      :class="visible ? 'translate-x-0' : 'translate-x-full'"
    >
      <DBEngineChangeSelect
        :init-value="currentSettings.databaseEngine"
        @engine-change="onEngineChange"
      />

      <CustomSelect
        v-model="currentSettings.namingConvention"
        :label="$t('Naming convention')"
        :options="conventionSelectOptions"
        :hint="$t('Will only apply to newly created tables')"
      />

      <CustomSelect
        v-model="defaultPrimaryTypeName"
        :label="$t('Default Primary Key')"
        :options="primaryColumnOptions"
      />

      <Separator />

      <CustomCheckbox
        v-model="currentSettings.generateMtMPrimaryKey"
        :label="$t('Generate primary key for MtM tables')"
      />

      <template v-if="currentSettings.generateMtMPrimaryKey">
        <CustomSelect
          v-model="mtmPrimaryKeyTypeName"
          :label="$t('Default MtM Primary Key')"
          :options="primaryColumnOptions"
        />
      </template>

      <Separator />

      <CustomSelect
        v-model="currentSettings.dragCanvasButton"
        :label="$t('Drag canvas button')"
        :options="dragButtonSelectOptions"
      />

      <CustomCheckbox
        v-model="currentSettings.snapToGrid"
        :label="$t('Snap to grid')"
        :hint="$t('Experimental, may be broken')"
      />

      <ClampedNumberInput
        v-model="currentSettings.undoActionBufferSize"
        :label="$t('Action buffer size')"
        :min-value="0"
        :max-value="MAX_UNDO_BUFFER_SIZE"
        :hint="$t('Capped to {max} to prevent performance issues', { max: MAX_UNDO_BUFFER_SIZE })"
      />

      <Separator />

      <UserDefinedColumnTypeDisplay />
    </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/store/settings.ts";
import CustomSelect from "@/components/core/inputs/CustomSelect.vue";
import type { SelectOption } from "@/types/misc.ts";
import { computed } from "vue";
import DBEngineChangeSelect from "@/components/settings/DBEngineChangeSelect.vue";
import { type DatabaseEngine, DatabaseEngines } from "@/types/TableColumnTypes/tableField.ts";
import CustomCheckbox from "@/components/core/inputs/CustomCheckbox.vue";
import { useI18n } from "vue-i18n";
import Separator from "@/components/core/Separator.vue";
import ClampedNumberInput from "@/components/core/inputs/ClampedNumberInput.vue";
import UserDefinedColumnTypeDisplay from "@/components/settings/UserDefinedColumnTypeDisplay.vue";
import { MAX_UNDO_BUFFER_SIZE } from "@/types/constants.ts";

defineProps<{
  visible: boolean
}>();

const i18n = useI18n();

const settingsStore = useSettingsStore();

const { currentSettings, currentDatabaseColumnTypes } = storeToRefs(settingsStore);

const conventionSelectOptions: SelectOption[] = [
  {
    label: 'snake_case',
    value: 'snake',
  },
  {
    label: 'CamelCase',
    value: 'camel',
  }
];

const dragButtonSelectOptions: SelectOption[] = [
  {
    label: i18n.t('MMB'),
    value: 'middle',
  },
  {
    label: i18n.t('LMB'),
    value: 'left',
  }
];

const primaryColumnOptions = computed((): SelectOption[] =>
  currentDatabaseColumnTypes.value
    .filter(t => t.flags.canBePrimaryKey)
    .map(type => {
      return {
        label: type.displayName,
        value: type.displayName
      };
    }));

const defaultPrimaryTypeName = computed({
  get: () => currentSettings.value.defaultPrimaryType.displayName,
  set: (name: string) => {
    const type = currentDatabaseColumnTypes.value.find(t => t.displayName === name);
    if (type) currentSettings.value.defaultPrimaryType = type;
  }
});

const mtmPrimaryKeyTypeName = computed({
  get: () => currentSettings.value.mtmPrimaryKeyType.displayName,
  set: (name: string) => {
    const type = currentDatabaseColumnTypes.value.find(t => t.displayName === name);
    if (type) currentSettings.value.mtmPrimaryKeyType = type;
  }
});

const onEngineChange = (val: DatabaseEngine) => {
  // Sanity check
  if (!DatabaseEngines.includes(val)) { return; }
  settingsStore.setCurrentEngine(val);
};

</script>