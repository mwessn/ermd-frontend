<template>
    <div
      class="absolute left-full bottom-0
        bg-lycheeIce text-sm z-90
        rounded-r-lg rounded-tl-lg shadow-lg"
    >
      <div v-if="col.type.modifier && col.modifierValues" class="flex justify-center border-b border-b-accentDarkGray">
        <ModifierValueInput
          v-for="(mod, index) in col.type.modifier"
          :key="index"
          v-model="col.modifierValues[index]"

          :mod="mod"

          @change="onChange"
          @remove-value="removeModifierValue(index)"
        />
      </div>

      <div class="flex text-center">
        <ColPropertyCheckbox
          v-model="col.primaryKey"
          label="PK"
          :disabled="flagsLocked || !colCanBePrimary(col)"
          @change="onChange"
        />
        <ColPropertyCheckbox
          v-model="col.notNull"
          label="NN"
          :disabled="flagsLocked || !colCanBeNullable(col)"
          @change="onChange"
        />
        <ColPropertyCheckbox
          v-model="col.unique"
          label="U"
          :disabled="flagsLocked || col.primaryKey"
          @change="onChange"
        />
        <ColPropertyCheckbox
          v-model="col.autoIncrement"
          label="AI"
          :disabled="flagsLocked || !colCanAutoIncrement(col) || col.primaryKey"
          @change="onChange"
        />

        <div
          v-if="col.type.flags.canHaveDefault"
          class="p-2 border-l border-l-accentDarkGray grid gap-2"
        >
          <p class="wrap-break-word w-12">
            {{ $t('Default') }}
          </p>
          <div class="flex items-center gap-1">
            <template v-if="col.defaultValue != undefined">
              <p v-if="col.type.primitive == 'list'">
                [
              </p>
              <p v-if="col.type.primitive == 'json'">
                {
              </p>
            </template>
            <input
              v-model="col.defaultValue"
              :placeholder="defaultPlaceholder"

              class="self-end border-b text-center w-12"
              :class="validateDefaultValue"

              :type="defaultInputType"
              name="column default value"

              autocomplete="off"

              :min="col.type.flags.minValue as number"
              :max="col.type.flags.maxValue as number"

              :disabled="!colCanHaveDefault(col)"

              @click="onInputClick"
              @change="onChange"
            >
            <template v-if="col.defaultValue != undefined">
              <p v-if="col.type.primitive == 'list' && showBrackets">
                ]
              </p>
              <p v-if="col.type.primitive == 'json' && showBrackets">
                }
              </p>
              <FontAwesomeIcon
                class="cursor-pointer hover:opacity-50 ml-1"
                :icon="faClose"
                @click="removeDefaultValue"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import {
  colCanAutoIncrement,
  colCanBeNullable,
  colCanBePrimary,
  colCanHaveDefault,
  type TableCol
} from "@/types/table.ts";
import ColPropertyCheckbox from "@/components/designer/table/ColumnProperties/ColPropertyCheckbox.vue";
import { computed, nextTick, ref, watch } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { nullOrEmpty } from "@/utils/utils.ts";
import { cloneDeep } from "lodash";
import ModifierValueInput from "@/components/designer/table/ColumnProperties/ModifierValueInput.vue";

const col = defineModel<TableCol>('col', { required: true });

let oldVal = cloneDeep(col.value);

const emit = defineEmits<{
  change: [oldVal: TableCol]
}>();

const flagsLocked = computed(() => col.value.type.primitive == 'serial');

const removeModifierValue = (index: number) => {
  if (col.value.modifierValues && col.value.modifierValues[index]) {
    col.value.modifierValues[index] = undefined;
    onChange();
  }
};

const removeDefaultValue = () => {
  col.value.defaultValue = undefined;
  onChange();
};

const onChange = async () => {
  await nextTick();
  emit('change', oldVal);
  oldVal = cloneDeep(col.value);
};

const showBrackets = ref<boolean>(col.value.defaultValue !== undefined);

const defaultPlaceholder = computed(() => col.value.defaultValue == undefined ? 'none' : '');

const onInputClick = () => {
  const p = col.value.type.primitive;
  if (p == 'list') {
    showBrackets.value = true;
  }
  if (p == 'json') {
    showBrackets.value = true;
    col.value.defaultValue = '';
  }
};

const defaultInputType = computed(() => {
  switch (col.value.type.primitive) {
    case 'int':
    case 'decimal':
    case 'float':
    case 'bit':
      return 'number';
    case 'bigint':
    case 'string':
    case 'list':
    case 'list enum':
    case 'enum':
    case 'json':
      return 'string';
    default:
      return 'string';
  }
});

// input validation
watch(() => col.value.defaultValue, (val) => {
  if (val == null || val === "") return;

  let sanitized: string | undefined;

  switch (col.value.type.primitive) {

    // Only integers
    case "int":
    case "bit":
      if (!/^-?\d+$/.test(val)) {
        sanitized = val.replace(/[^0-9-]/g, "");
      }
      break;

      // Must be a decimal number (with .)
    case "float":
    case "decimal":
      if (!/^-?\d+\.\d+$/.test(val)) {
        // Convert to decimal format if possible
        if (/^-?\d+$/.test(val)) {
          sanitized = val + ".0";
        } else {
          // strip invalid chars but keep one "."
          sanitized = val
            .replace(/[^0-9.-]/g, "")
            .replace(/(\..*)\./g, "$1");
        }
      }
      break;

      // bigint → integer but may exceed JS range
    case "bigint":
      if (!/^-?\d+$/.test(val)) {
        sanitized = val.replace(/[^0-9-]/g, "");
      }
      break;

    case 'json':
      if (val.startsWith("{")) {
        sanitized = val.slice(1);
      }
      break;

    case 'list enum':
      if (val.startsWith("[")) {
        sanitized = val.slice(1);
      }
      break;

    default:
      break;
  }

  if (sanitized !== undefined) {
    col.value.defaultValue = sanitized;
  }
});

const validateDefaultValue = computed(() => {
  if (col.value.type.primitive == 'list') {
    if (
      col.value.modifierValues == undefined ||
        nullOrEmpty(col.value.modifierValues[0] as string) ||
        nullOrEmpty(col.value.defaultValue)
    ) { return ''; }

    const allowedTypes = (col.value.modifierValues[0] as string)
      .split(',')
      .map(it => it.trim());

    const inputTypes = (col.value.defaultValue as string)
      .split(',')
      .map(it => it.trim())
      .filter(Boolean);

    const invalidTypes = inputTypes.some(it => !allowedTypes.includes(it));

    return invalidTypes ? 'bg-red-300' : '';
  }
  return '';
});
</script>
