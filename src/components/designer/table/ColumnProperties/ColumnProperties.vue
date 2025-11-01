<template>
  <div
      class="absolute left-full bottom-0
        bg-accentGray text-sm z-90
        rounded-r-lg rounded-tl-lg"
  >
    <div v-if="col.type.modifier && col.modifierValues" class="flex justify-center border-b border-b-accentDarkGray">
      <ModifierValueInput
          v-for="(mod, index) in col.type.modifier"
          v-model="col.modifierValues[index]"
          :mod="mod"
          :is-list="col.type.primitive == 'list'"

          :key="index"

          @change="onChange"
          @removeValue="removeModifierValue(index)"
      />
    </div>

    <div class="flex text-center">
      <ColPropertyCheckbox
          v-model="col.primaryKey"
          label="PK"
          :disabled="!colCanBePrimary(col)"
          @change="onChange"
      />
      <ColPropertyCheckbox
          v-model="col.notNull"
          label="NN"
          :disabled="!colCanBeNullable(col)"
          @change="onChange"
      />
      <ColPropertyCheckbox
          v-model="col.unique"
          label="U"
          :disabled="col.primaryKey"
          @change="onChange"
      />
      <ColPropertyCheckbox
          v-model="col.autoIncrement"
          label="AI"
          :disabled="!colCanAutoIncrement(col) || col.primaryKey"
          @change="onChange"
      />

      <div class="p-2 border-l border-l-accentDarkGray grid gap-2">
        <p class="wrap-break-word w-12">{{ $t('Default') }}</p>
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
import { colCanAutoIncrement, colCanBeNullable, colCanBePrimary, type TableCol } from "@/types/table.ts";
import ColPropertyCheckbox from "@/components/designer/table/ColumnProperties/ColPropertyCheckbox.vue";
import { computed, nextTick, type PropType, ref, watch } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { nullOrEmpty } from "@/utils/utils.ts";
import type { ColumnTypeModifier } from "@/types/TableColumnTypes/tableField.ts";
import { cloneDeep } from "lodash";
import ModifierValueInput from "@/components/designer/table/ColumnProperties/ModifierValueInput.vue";

const props = defineProps({
  col: {
    type: Object as PropType<TableCol>,
    required: true
  },
});

let oldVal = cloneDeep(props.col);

const emit = defineEmits(['change']);

const removeModifierValue = (index: number) => {
  if (props.col.modifierValues && props.col.modifierValues[index]) {
    props.col.modifierValues[index] = undefined;

    onChange();
  }
}

const removeDefaultValue = () => {
  props.col.defaultValue = undefined;

  onChange();
}

const onChange = async () => {
  await nextTick();

  emit('change', oldVal);

  oldVal = cloneDeep(props.col);
}

const showBrackets = ref<boolean>(props.col.defaultValue !== undefined);

const defaultPlaceholder = computed(() => props.col.defaultValue == undefined ? 'none' : '');

const onInputClick = () => {
  const p = props.col.type.primitive
  if (p == 'list') {
    showBrackets.value = true;
  }
  if (p == 'json') {
    showBrackets.value = true;
    props.col.defaultValue = '';
  }
}

const modifierInputType = (mod: ColumnTypeModifier) => {
  switch (typeof mod.defaultValue) {
    case 'number':
      return 'number'
    case 'string':
      return 'string';
    default:
      return 'string';
  }
};

const defaultInputType = computed(() => {
  switch (props.col.type.primitive) {
    case 'int':
    case 'decimal':
    case 'float':
    case 'bit':
      return 'number'
    case 'bigint':
    case 'char':
    case 'string':
    case 'list':
    case 'json':
      return 'string';
    default:
      return 'string';
  }
});

// input validation
watch(() => props.col.defaultValue, (val) => {
  if (val == null || val === "") return;

  switch (props.col.type.primitive) {

      // Only integers
    case "int":
    case "bit":
      if (!/^-?\d+$/.test(val)) {
        props.col.defaultValue = val.replace(/[^0-9-]/g, "");
      }
      break;

      // Must be a decimal number (with .)
    case "float":
    case "decimal":
      if (!/^-?\d+\.\d+$/.test(val)) {
        // Convert to decimal format if possible
        if (/^-?\d+$/.test(val)) {
          props.col.defaultValue = val + ".0";
        } else {
          // strip invalid chars but keep one "."
          props.col.defaultValue = val
              .replace(/[^0-9.-]/g, "")
              .replace(/(\..*)\./g, "$1");
        }
      }
      break;

      // bigint → integer but may exceed JS range
    case "bigint":
      if (!/^-?\d+$/.test(val)) {
        props.col.defaultValue = val.replace(/[^0-9-]/g, "");
      }
      break;

    case 'json':
      if (props.col.defaultValue?.startsWith("{")) {
        props.col.defaultValue = props.col.defaultValue.slice(1);
      }
      break;

    case 'set':
      if (props.col.defaultValue?.startsWith("[")) {
        props.col.defaultValue = props.col.defaultValue.slice(1);
      }
      break;

    default:
      break;
  }
});

const validateDefaultValue = computed(() => {
  if (props.col.type.primitive == 'list') {
    if (
        props.col.modifierValues == undefined ||
        nullOrEmpty(props.col.modifierValues[0] as string) ||
        nullOrEmpty(props.col.defaultValue)
    ) { return '' }

    const allowedTypes = (props.col.modifierValues[0] as string)
        .split(',')
        .map(it => it.trim());

    const inputTypes = (props.col.defaultValue as string)
        .split(',')
        .map(it => it.trim())
        .filter(Boolean);

    const invalidTypes = inputTypes.some(it => !allowedTypes.includes(it));

    return invalidTypes ? 'bg-red-300' : ''
  }
})
</script>