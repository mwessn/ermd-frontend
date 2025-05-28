
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

    const translateOffsetX = ref(0);
    const translateOffsetY = ref(0);

    const scaleFactor = ref<number>(1);

    const lastClickPos = ref<CursorPos | undefined>();
    const currentMousePos = ref<CursorPos | undefined>();

    const isDragging = computed(() =>
        !!lastClickPos.value && lastClickPos.value != currentMousePos.value
    );

    const bgPos = computed(() =>
        `${ translateOffsetX.value }px ${ translateOffsetY.value }px`
    );

    const translatePos = computed(() =>
        `${ translateOffsetX.value }px, ${ translateOffsetY.value }px`
    );

    const onMouseDown = (evt: MouseEvent) => {
        switch (actionStore.currentAction) {
            case undefined: {
                const pos = { x: evt.clientX, y: evt.clientY };
                lastClickPos.value = pos;
                currentMousePos.value = pos;
                break;
            }
            case 'table': {
                const x = evt.clientX;
                const y = evt.clientY;

                // console.log('client', evt.clientX, evt.clientY)
                // console.log('offset', evt.offsetX, evt.offsetY)
                // console.log('page', evt.pageX, evt.pageY)

                // Apply inverse transformation
                const posX = x - translateOffsetX.value;
                const posY = y - translateOffsetY.value;


                designStore.addTable(posX, posY);
                break;
            }
        }

        actionStore.setAction(undefined);
    };

    const onMouseUp = () => {
        lastClickPos.value = undefined;
    };

    const onMouseMove = (evt: MouseEvent) => {
        if (!lastClickPos.value || !currentMousePos.value) return;

        translateOffsetX.value += evt.movementX;
        translateOffsetY.value += evt.movementY;

        currentMousePos.value = { x: evt.clientX, y: evt.clientY };
    };

    const onScroll = (evt: WheelEvent) => {
        // Disabled until better times

        // const zoomStep = 0.02;
        //
        // const direction = evt.deltaY < 0 ? 1 : -1;
        //
        // scaleFactor.value = clamp(scaleFactor.value + direction * zoomStep, 0.2, 1.5);
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