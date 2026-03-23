<template>
    <div
      class="fixed right-0 h-full p-4 mt-header-height w-right-menu-width
          bg-accentDarkGray text-center z-100
          text-textColor overflow-auto pb-24
            transition-transform duration-300
            border-l border-backgroundDark"
      :class="visible ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="flex mb-4 rounded overflow-hidden border border-accentGray">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="flex-1 py-2 text-sm cursor-pointer transition-colors"
          :class="activeTab === tab.value
            ? 'bg-monolithicCyanTsunami text-headerBlack'
            : 'bg-backgroundDark text-textColor hover:opacity-80'"
          @click="activeTab = tab.value"
        >
          {{ $t(tab.label) }}
        </button>
      </div>

      <ShortcutEditor v-if="activeTab === 'shortcuts'" />

      <template v-if="activeTab === 'general'">
        <CustomSelect
          v-model="currentSettings.language"
          :label="$t('settings.language')"
          :options="languageOptions"
          @change="onLanguageChange"
        />

        <Separator />

        <DBEngineChangeSelect
          :init-value="currentSettings.databaseEngine"
          @engine-change="onEngineChange"
        />

        <CustomSelect
          v-model="currentSettings.namingConvention"
          :label="$t('settings.namingConvention.label')"
          :options="conventionSelectOptions"
          :hint="$t('settings.namingConvention.hint')"
        />

        <CustomSelect
          v-model="defaultPrimaryTypeName"
          :label="$t('settings.defaultPrimaryKey')"
          :options="primaryColumnOptions"
        />

        <Separator />

        <CustomCheckbox
          v-model="currentSettings.generateMtMPrimaryKey"
          :label="$t('settings.generateMtMPrimaryKey')"
        />

        <template v-if="currentSettings.generateMtMPrimaryKey">
          <CustomSelect
            v-model="mtmPrimaryKeyTypeName"
            :label="$t('settings.defaultMtMPrimaryKey')"
            :options="primaryColumnOptions"
          />
        </template>

        <CustomCheckbox
          v-model="currentSettings.updateForeignKeysOnPrimaryChange"
          :label="$t('settings.updateFKTypes.label')"
          :hint="$t('settings.updateFKTypes.hint')"
        />

        <CustomCheckbox
          v-model="currentSettings.deleteForeignKeyColumnOnRelationDelete"
          :label="$t('settings.deleteFKColumn.label')"
          :hint="$t('settings.deleteFKColumn.hint')"
        />

        <CustomCheckbox
          v-model="currentSettings.deleteLinkedCommentsWithEntity"
          :label="$t('settings.deleteLinkedComments.label')"
          :hint="$t('settings.deleteLinkedComments.hint')"
        />

        <Separator />

        <CustomSelect
          v-model="currentSettings.dragCanvasButton"
          :label="$t('settings.dragCanvasButton')"
          :options="dragButtonSelectOptions"
        />

        <CustomCheckbox
          v-model="currentSettings.snapToGrid"
          :label="$t('settings.snapToGrid.label')"
          :hint="$t('settings.snapToGrid.hint')"
        />

        <ClampedNumberInput
          v-model="currentSettings.undoActionBufferSize"
          :label="$t('settings.actionBufferSize.label')"
          :min-value="0"
          :max-value="MAX_UNDO_BUFFER_SIZE"
          :hint="$t('settings.actionBufferSize.hint', { max: MAX_UNDO_BUFFER_SIZE })"
        />

        <Separator />

        <UserDefinedColumnTypeDisplay />
      </template>
    </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/store/settings.ts";
import CustomSelect from "@/components/core/inputs/CustomSelect.vue";
import type { SelectOption } from "@/types/misc.ts";
import type { AppLocale } from "@/types/misc.ts";
import { computed, ref } from "vue";
import DBEngineChangeSelect from "@/components/settings/DBEngineChangeSelect.vue";
import { type DatabaseEngine, DatabaseEngines } from "@/types/TableColumnTypes/tableField.ts";
import CustomCheckbox from "@/components/core/inputs/CustomCheckbox.vue";
import { useI18n } from "vue-i18n";
import Separator from "@/components/core/Separator.vue";
import ClampedNumberInput from "@/components/core/inputs/ClampedNumberInput.vue";
import UserDefinedColumnTypeDisplay from "@/components/settings/UserDefinedColumnTypeDisplay.vue";
import ShortcutEditor from "@/components/settings/ShortcutEditor.vue";
import { MAX_UNDO_BUFFER_SIZE } from "@/types/constants.ts";

type SettingsTab = 'general' | 'shortcuts';

defineProps<{
  visible: boolean
}>();

const activeTab = ref<SettingsTab>('general');

const tabs: readonly { value: SettingsTab; label: string }[] = [
  { value: 'general', label: 'settings.tabs.general' },
  { value: 'shortcuts', label: 'settings.tabs.shortcuts' },
];

const i18n = useI18n();

const languageLabels: Record<AppLocale, string> = {
  en: '\uD83C\uDF0D English',
  ga: '\uD83C\uDDEE\uD83C\uDDEA Gaeilge',
  ja: '\uD83C\uDDEF\uD83C\uDDF5 \u65E5\u672C\u8A9E',
};

const languageOptions: SelectOption[] = [
  { label: languageLabels.en, value: 'en' },
  { label: languageLabels.ga, value: 'ga' },
  { label: languageLabels.ja, value: 'ja' },
];

const onLanguageChange = () => {
  i18n.locale.value = currentSettings.value.language;
};

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