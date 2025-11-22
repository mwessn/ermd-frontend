
import { ref, computed } from 'vue';
import { useActionsStore } from "@/store/action.ts";
import { useDesignStore } from "@/store/design.ts";
import { clamp } from "@/utils/utils.ts";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/store/settings.ts";
import { cloneDeep } from "lodash";
import type { Table } from "@/types/table.ts";
import type { CommentArea } from "@/types/misc.ts";

export interface CursorPos {
    x: number;
    y: number;
}

export interface AreaSize {
    width: number;
    height: number;
}

export function useDesignCanvas() {
    const actionStore = useActionsStore();
    const designStore = useDesignStore();

    const { currentSettings } = storeToRefs(useSettingsStore());
    const {
        selectedTable,
        resizedTable,
        movedCommentArea,
        resizedCommentArea,
        tempCommentArea,
    } = storeToRefs(designStore);

    // How much the canvas is dragged from its center
    const translateOffsetX = ref(0);
    const translateOffsetY = ref(0);

    // Canvas zoom
    const scaleFactor = ref<number>(1);

    // Drag detection
    const lastClickPos = ref<CursorPos | undefined>();
    const lastClickType = ref<'left' | 'middle' | undefined>(undefined);
    const currentMousePos = ref<CursorPos | undefined>();

    // (Buffer variable) initial position of selected table before drag
    const lastSelectedPos = ref<CursorPos| undefined>(undefined);

    const lastWidth = ref<number| undefined>(undefined);
    const lastSize = ref<AreaSize | undefined>(undefined);
    const lastCommentAreaPosition = ref<CursorPos | undefined>(undefined);

    // Comment area moving binding
    const intersectingTables = ref<Table[]>([]);
    const intersectingAreas = ref<CommentArea[]>([]);

    const isDragging = computed(() =>
        !!lastClickPos.value && lastClickPos.value != currentMousePos.value
    );

    // background-position property
    const bgPos = computed(() =>
        `${ translateOffsetX.value }px ${ translateOffsetY.value }px`
    );

    // transform translate property
    const translatePos = computed(() =>
        `${ translateOffsetX.value }px, ${ translateOffsetY.value }px`
    );

    const startTracking = (evt: MouseEvent) => {
        // Start tracking drag
        const pos = { x: evt.clientX, y: evt.clientY };
        lastClickPos.value = pos;
        currentMousePos.value = pos;
    }

    const onMouseDown = async (evt: MouseEvent) => {
        switch (actionStore.currentAction) {
            case undefined: {
                lastClickType.value = "left";
                startTracking(evt);

                if (resizedCommentArea.value != undefined) {
                    lastSize.value = cloneDeep(resizedCommentArea.value.size);
                }
                if (movedCommentArea.value != undefined) {
                    lastCommentAreaPosition.value = {
                        x: movedCommentArea.value.posX,
                        y: movedCommentArea.value.posY
                    }
                    intersectingTables.value = designStore.getTablesInsideArea(movedCommentArea.value);
                    intersectingAreas.value = designStore.getAreasInsideArea(movedCommentArea.value);
                }

                break;
            }
            case 'table': {
                // Create a table
                const posX = evt.clientX / scaleFactor.value - translateOffsetX.value;
                const posY = evt.clientY / scaleFactor.value - translateOffsetY.value;

                designStore.addTable(posX, posY);
                actionStore.setAction(undefined);
                break;
            }
            case 'ioto':
            case 'noto':
            case 'iotm':
            case 'notm':
            case 'mtm': {
                designStore.createRelationship(actionStore.currentAction);
                break;
            }
            case 'commentArea': {
                startTracking(evt);
                designStore.startCreatingCommentArea({
                    x: evt.clientX / scaleFactor.value - translateOffsetX.value,
                    y: evt.clientY / scaleFactor.value - translateOffsetY.value
                });

                actionStore.setAction(undefined);
                break;
            }
        }
    };

    const stopTracking = () => {
        // Stop tracking drag
        lastClickPos.value = undefined;

        // Quite arbitrary really, but for the best practices let it be
        lastClickType.value = undefined;
    }

    const onMouseUp = () => {
        if (lastClickPos.value) {
            stopTracking();

            // If moved a table, add buffer entry
            if (lastSelectedPos.value) {
                designStore.bufferLogTableMove(lastSelectedPos.value);
                lastSelectedPos.value = undefined;
            }
            if (lastWidth.value) {
                designStore.bufferLogTableResize(lastWidth.value);
                lastWidth.value = undefined;
            }

            if (tempCommentArea.value != undefined) {
                designStore.storeCommentArea();
            }

            if (lastSize.value) {
                designStore.bufferLogCommentAreaResize(lastSize.value);
                designStore.setResizedCommentArea();
            }

            if (lastCommentAreaPosition.value) {
                designStore.bufferLogCommentAreaMove(
                    lastCommentAreaPosition.value,
                    intersectingTables.value,
                    intersectingAreas.value
                );
                designStore.setMovedCommentArea();
                intersectingTables.value = [];
                intersectingAreas.value = [];
            }

            // Reset references
            designStore.setResizedTable();
        }
    };

    const onMiddleMouseDown = (evt: MouseEvent) => {
        if (currentSettings.value.dragCanvasButton == 'middle') {
            lastClickType.value = "middle";
            startTracking(evt);
        }
    }

    const onMiddleMouseUp = () => {
        if (currentSettings.value.dragCanvasButton == 'middle' && lastClickPos.value) {
            stopTracking();
        }
    }

    const onMouseMove = (evt: MouseEvent) => {
        // If not dragging return
        if (!lastClickPos.value || !currentMousePos.value) return;

        // If current button is MMB we can only move the canvas
        if (
            currentSettings.value.dragCanvasButton == 'middle' &&
            lastClickType.value == "middle"
        ) {
            translateOffsetX.value += evt.movementX;
            translateOffsetY.value += evt.movementY;
            return;
        }

        const deltaX = evt.movementX / scaleFactor.value;
        const deltaY = evt.movementY / scaleFactor.value;

        // Handle comment areas
        const commentArea = tempCommentArea.value
            ?? resizedCommentArea.value;
        if (commentArea) {
            designStore.resizeCommentArea(commentArea, deltaX, deltaY);
        }
        else if (movedCommentArea.value) {
            designStore.moveCommentArea(
                deltaX,
                deltaY,
                intersectingTables.value,
                intersectingAreas.value
            );
        }

        // No table selected, drag canvas
        else if (!selectedTable.value) {
            if (currentSettings.value.dragCanvasButton == 'middle') { return; }

            translateOffsetX.value += evt.movementX;
            translateOffsetY.value += evt.movementY;
        }
        // Handle table move/resize
        else {
            const table = selectedTable.value;
            if (resizedTable.value) {
                if (!lastWidth.value) lastWidth.value = cloneDeep(resizedTable.value.widthPx);
                designStore.resizeSelectedTable(deltaX);
            } else {
                if (!lastSelectedPos.value) {
                    lastSelectedPos.value = { x: table.posX, y: table.posY };
                }
                designStore.moveSelectedTable(deltaX, deltaY);
            }
        }

        currentMousePos.value = { x: evt.clientX, y: evt.clientY };
    };

    const onScroll = (evt: WheelEvent) => {
        const zoomMultiplier = evt.shiftKey ? 3 : 1;

        const zoomStep = 0.02 * zoomMultiplier;

        const direction = evt.deltaY < 0 ? 1 : -1;

        // Adjust transform so it zooms to the cursor position
        const oldScale = scaleFactor.value;
        const newScale = clamp(oldScale + direction * zoomStep, 0.2, 1.5);

        const rect = (evt.currentTarget as HTMLElement).getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        translateOffsetX.value -= (x/oldScale - x/newScale);
        translateOffsetY.value -= (y/oldScale - y/newScale);

        scaleFactor.value = newScale;
    }

    const centerView = (x = 0, y = 0) => {
        translateOffsetX.value = x;
        translateOffsetY.value = y;

        scaleFactor.value = 1;
    };

    return {
        translateOffsetX,
        translateOffsetY,
        scaleFactor,

        isDragging,
        bgPos,
        translatePos,

        onMouseDown,
        onMouseUp,
        onMouseMove,
        onScroll,

        onMiddleMouseDown,
        onMiddleMouseUp,

        centerView,
    };
}