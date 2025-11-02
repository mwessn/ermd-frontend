<template>
  <div
      class="absolute border border-lycheeIce rounded-lg z-1 opacity-75"
      :class="isTemporary ? 'min-w-0.5 min-h-0.5' : 'min-w-24 min-h-24'"
      :style="{ top: area.posY + 'px', left: area.posX + 'px',
       width: area.size.width + 'px', height: area.size.height + 'px',
        background: area.color}"
  >
<!--  Header  -->
    <div
        class="comment-area-header w-full relative
          text-lycheeIce bg-accentDarkGray p-2 flex items-center justify-between
            rounded-t-lg"
        :style="{ fontSize: headerFontSize + 'px' }"
    >
      <div class="flex items-center gap-2">
        <FontAwesomeIcon
            :icon="faPalette"
            class="cursor-pointer hover:opacity-50"
            :style="{ color: area.color }"
            @mouseup.left="showColorSelector = !showColorSelector"

            @mouseenter="colorSelectorIconHovered = true"
            @mouseleave="colorSelectorIconHovered = false"
        />
        <DoubleClickFocusInput
            v-model="area.name"

            class="max-w-52"

            @valueChange="onChange"
            @enter-key="resetFocus"

            allow-shift-key
        />
      </div>
      <div class="flex items-center gap-4 overflow-hidden">
        <FontAwesomeIcon
            :icon="faTrashCan"
            class="cursor-pointer text-accentGray hover:opacity-50"
            @mouseup.left="deleteCommentArea(area)"
        />
        <div
            class="h-6 w-6 bg-accentDarkGray radial-accentGray cursor-move"
            @mousedown.left="setMovedCommentArea(area)"
        />
      </div>

      <!-- Color picker -->
      <AreaColorSelector
          v-if="showColorSelector"
          class="absolute bottom-full left-0"
          v-model="area.color"
          @focusout="onColorSelectorFocusOut"

          @change="onChange"
      />
    </div>

<!--  Comment box  -->
    <div
        class="mt-3 w-fit h-fit ml-3 max-h-10/12 max-w-10/12
          min-h-6 min-w-6 origin-top-left
        text-accentDarkGray rounded mb-3 relative"
        :style="{ scale: commentAreaScale }"
         @mousedown.stop
    >
      <FontAwesomeIcon
          :icon="area.showComment ? faChevronUp : faChevronDown"
          class="cursor-pointer absolute right-1 top-1 bg-accentGray rounded p-1 shadow-lg"
          @mouseup.left="area.showComment = !area.showComment"
      />
      <textarea
          v-if="area.showComment"
          v-model="area.comment"
          :placeholder="$t('Comment')"
          rows="3"
          class="resize max-h-26 max-w-full box-border bg-accentGray p-1 rounded"

          @change="onChange"
      />
    </div>

<!--  Resize handle  -->
    <div
        class="absolute bottom-0 right-0 rounded-br-lg rounded-tl
          h-4 w-4 bg-accentDarkGray radial-accentGray cursor-nw-resize"
        @mousedown.left="setResizedCommentArea(area)"
    />
  </div>

</template>

<script setup lang="ts">
import { computed, type PropType, ref } from "vue";
import type { CommentArea } from "@/types/misc.ts";
import { cloneDeep } from "lodash";
import DoubleClickFocusInput from "@/components/core/DoubleClickFocusInput.vue";
import { resetFocus } from "@/utils/utils.ts";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faChevronDown, faChevronUp, faPalette, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { useDesignStore } from "@/store/design.ts";
import AreaColorSelector from "@/components/core/AreaColorSelector.vue";

const props = defineProps({
  area: {
    type: Object as PropType<CommentArea>,
    required: true
  },
  isTemporary: {
    type: Boolean,
    default: false
  },
  scaleValue: {
    type: Number,
    default: 1,
  }
});

const {
    setResizedCommentArea,
    setMovedCommentArea,
    deleteCommentArea,
} = useDesignStore();

const {
  bufferLogCommentAreaChange
} = useDesignStore();

const oldVal = ref<CommentArea>(cloneDeep(props.area));

const headerFontSize = computed(() => {
  if (props.scaleValue < 0.4) { return 32; }
  if (props.scaleValue < 0.6) { return 28; }
  if (props.scaleValue < 0.8) { return 24; }
  if (props.scaleValue < 1) { return 20; }
  return 16;
});

const commentAreaScale = computed(() => Math.max(2 - props.scaleValue, 1));

const showColorSelector = ref<boolean>(false);
const onChange = () => {
  // Update values that might have been modified externally
  oldVal.value.posX = props.area.posX;
  oldVal.value.posY = props.area.posY;
  oldVal.value.size = props.area.size;

  bufferLogCommentAreaChange(oldVal.value);
  oldVal.value = cloneDeep(props.area);
}

const colorSelectorIconHovered = ref<boolean>(false);

const onColorSelectorFocusOut = () => {
  if (!colorSelectorIconHovered.value) {
    showColorSelector.value = false;
  }
}
</script>

<style scoped>
.comment-area-header {
  transition: font-size .2s ease;
}
</style>