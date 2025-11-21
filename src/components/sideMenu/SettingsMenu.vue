<template>
  <div
      class="fixed right-0 h-full px-2 pt-4 mt-12 w-64
       bg-accentDarkGray text-center z-50
       text-textColor
        transition-transform duration-300"
      :class="visible ? 'translate-x-0' : 'translate-x-full'"
  >
    <CustomSelect
        v-model="currentSettings.databaseEngine"
        :label="$t('Database Engine')"
        :options="engineSelectOptions"
    />

    <CustomSelect
        v-model="currentSettings.namingConvention"
        :label="$t('Naming convention')"
        :options="conventionSelectOptions"
    />

    <CustomSelect
        v-model="currentSettings.defaultPrimaryType"
        :label="$t('Naming convention')"
        :options="primaryColumnOptions"
    />

    {{ currentSettings }}

  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/store/settings.ts";
import CustomSelect from "@/components/core/inputs/CustomSelect.vue";
import { DatabaseEngines, EngineNamingMap } from "@/types/TableColumnTypes/tableField.ts";
import type { SelectOption } from "@/types/misc.ts";
import { computed } from "vue";

defineProps({
  visible: {
    type: Boolean,
    required: true,
  }
});

const { currentSettings, currentDatabaseColumnTypes } = storeToRefs(useSettingsStore());

const engineSelectOptions: SelectOption[] = DatabaseEngines.map(e => {
  return {
    value: e,
    label: EngineNamingMap[e]
  }
});

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

const primaryColumnOptions = computed((): SelectOption[] =>
    currentDatabaseColumnTypes.value
        .filter(t => t.flags.canBePrimaryKey)
        .map(type => {
          return {
            label: type.displayName,
            value: type
          }
        })
);

</script>