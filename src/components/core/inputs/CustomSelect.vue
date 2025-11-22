<template>
  <div :class="{ 'opacity-50' : disabled }">
    <div class="my-3 font-bold text-left text-accentGray">
      {{ label }}
    </div>
    <div
        class="rounded p-2 relative select-none min-h-10 cursor-pointer
       border border-accentGray bg-accentDarkGray
       text-tinted"
        :class="{ '!cursor-default': disabled }"
        ref="rootDiv"
        tabindex="-1"
        @click="toggleDropdown"
        @blur="onFocusOut"
    >
      <div class="w-full flex items-center gap-2 text-textColor">
        <div class="w-full overflow-ellipsis overflow-hidden text-nowrap">
          <template v-if="!selectedOption.value">
            {{ placeholder }}
          </template>
          <template v-else>
            {{ selectedOption.label }}
          </template>
        </div>
        <div class="w-8 flex items-center justify-center cursor-pointer">
          <FontAwesomeIcon v-if="changeDropdownVisible" :icon="faChevronUp" />
          <FontAwesomeIcon v-else :icon="faChevronDown" />
        </div>
      </div>

      <template v-if="!disabled && changeDropdownVisible">
        <div
            class="absolute w-full top-12 left-0 p-1.5
          bg-accentGray text-headerBlack shadow-lg opacity-95 z-20
           max-h-64 overflow-y-auto rounded"
            @click.stop
            @blur.stop
        >
          <div
              v-for="option in props.options"
              class="w-full p-1.5 h-8 rounded overflow-ellipsis
                overflow-hidden mb-1.5 flex gap-3 items-center
                hover:opacity-80 hover:bg-tinted"
              :class="{ 'border border-lycheeIce': selectedOption == option }"
              @click="onOptionClick(option)"
              @blur.stop
          >
            <p>{{ option.label }}</p>
          </div>
        </div>
      </template>
    </div>

    <p v-if="hint" class="text-sm text-accentGray my-2 text-left">
      {{ hint }}
    </p>
  </div>

</template>

<script setup lang="ts">
import { computed, type PropType, ref } from "vue";
import type { SelectOption } from "@/types/misc.ts";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { isEqual } from "lodash";

const model = defineModel({ type: [String, Object], required: true });

const props = defineProps({
  options: {
    type: Array as PropType<SelectOption[]>,
    required: true,
  },
  placeholder: {
    type: String,
    default: ""
  },
  label: {
    type: String,
    default: ""
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  hint: {
    type: String,
    default: ""
  }
});

const rootDiv = ref();

const emit = defineEmits(["change"]);

const selectedOption = computed((): SelectOption => props.options!.find(it => isEqual(it.value, model.value)) ?? {
  label: '',
  value: ''
});

const changeDropdownVisible = ref<boolean>(false);

const toggleDropdown = () => {
  changeDropdownVisible.value = !changeDropdownVisible.value;
}

const onOptionClick = async (val: SelectOption) => {
  if (!props.disabled && model.value !== val) {
    model.value = val.value;

    emit("change");

    changeDropdownVisible.value = false;
  }
}

function onFocusOut(event: FocusEvent) {
  if (rootDiv.value && !rootDiv.value.contains(event.relatedTarget as Node)) {
    changeDropdownVisible.value = false;
  }
}
</script>