<template>
    <div
      class="absolute border border-lycheeIce rounded-lg z-1 opacity-75"
      :class="props.isTemporary ? 'min-w-0.5 min-h-0.5' : 'min-w-24 min-h-24'"
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

            :placeholder="$t('new comment area')"

            @value-change="onChange"
            @enter-key="resetFocus"
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
          v-model="area.color"
          class="absolute bottom-full left-0"
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
        @keydown.stop
        @keyup.stop
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
import { computed, ref } from "vue";
import type { CommentArea } from "@/types/misc.ts";
import { cloneDeep } from "lodash";
import DoubleClickFocusInput from "@/components/core/DoubleClickFocusInput.vue";
import { resetFocus } from "@/utils/utils.ts";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faChevronDown, faChevronUp, faPalette, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { useDesignStore } from "@/store/design.ts";
import AreaColorSelector from "@/components/core/AreaColorSelector.vue";
import {
  COMMENT_AREA_FONT_SIZES,
  COMMENT_AREA_DEFAULT_FONT_SIZE,
  COMMENT_AREA_MIN_SCALE,
  COMMENT_AREA_MAX_SCALE
} from "@/types/constants.ts";

const area = defineModel<CommentArea>('area', { required: true });

const props = withDefaults(defineProps<{
  isTemporary?: boolean
  scaleValue?: number
}>(), {
  isTemporary: false,
  scaleValue: 1
});

const {
  setResizedCommentArea,
  setMovedCommentArea,
  deleteCommentArea,
  bufferLogCommentAreaChange
} = useDesignStore();

const oldVal = ref<CommentArea>(cloneDeep(area.value));

const headerFontSize = computed(() => {
  for (const { maxScale, fontSize } of COMMENT_AREA_FONT_SIZES) {
    if (props.scaleValue < maxScale) return fontSize;
  }
  return COMMENT_AREA_DEFAULT_FONT_SIZE;
});

const commentAreaScale = computed(() => Math.max(COMMENT_AREA_MAX_SCALE - props.scaleValue, COMMENT_AREA_MIN_SCALE));

const showColorSelector = ref<boolean>(false);
const onChange = () => {
  // Update values that might have been modified externally
  oldVal.value.posX = area.value.posX;
  oldVal.value.posY = area.value.posY;
  oldVal.value.size = area.value.size;

  bufferLogCommentAreaChange(oldVal.value);
  oldVal.value = cloneDeep(area.value);
};

const colorSelectorIconHovered = ref<boolean>(false);

const onColorSelectorFocusOut = () => {
  if (!colorSelectorIconHovered.value) {
    showColorSelector.value = false;
  }
};
</script>

<style scoped>
.comment-area-header {
  transition: font-size .2s ease;
}
</style>
