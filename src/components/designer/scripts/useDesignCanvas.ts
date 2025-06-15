
import { ref, computed } from 'vue';
import { useActionsStore } from "@/store/action.ts";
import { useDesignStore } from "@/store/design.ts";
import { clamp } from "@/utils/utils.ts";

export interface CursorPos {
    x: number;
    y: number;
}

export function useDesignCanvas() {
    const actionStore = useActionsStore();
    const designStore = useDesignStore();

    // How much the canvas is dragged from its center
    const translateOffsetX = ref(0);
    const translateOffsetY = ref(0);

    // Canvas zoom
    const scaleFactor = ref<number>(1);

    // Drag detection
    const lastClickPos = ref<CursorPos | undefined>();
    const currentMousePos = ref<CursorPos | undefined>();

    // (Buffer variable) initial position of selected table before drag
    const lastSelectedPos = ref<CursorPos| undefined>(undefined);


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

    const onMouseDown = async (evt: MouseEvent) => {
        switch (actionStore.currentAction) {
            case undefined: {
                // Start tracking drag
                const pos = { x: evt.clientX, y: evt.clientY };
                lastClickPos.value = pos;
                currentMousePos.value = pos;

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
                break;
            }
        }
    };

    const onMouseUp = () => {
        if (lastClickPos.value) {
            // Stop tracking drag
            lastClickPos.value = undefined;

            // If moved a table, add buffer entry
            if (lastSelectedPos.value) {
                designStore.bufferLogTableMove(lastSelectedPos.value);
                lastSelectedPos.value = undefined;
            }
        }
    };

    const onMouseMove = (evt: MouseEvent) => {
        // If not dragging return
        if (!lastClickPos.value || !currentMousePos.value) return;

        // If no table selected, drag canvas
        if (designStore.selectedTable == undefined) {
            translateOffsetX.value += evt.movementX;
            translateOffsetY.value += evt.movementY;
        } else {
            // Else move the table

            // If just started moving, write initial position to buffer
            if (!lastSelectedPos.value) {
                lastSelectedPos.value = {
                    x: designStore.selectedTable.posX,
                    y: designStore.selectedTable.posY
                }
            }

            designStore.moveSelectedTable(evt.movementX / scaleFactor.value, evt.movementY / scaleFactor.value);
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

        centerView,
    };
}