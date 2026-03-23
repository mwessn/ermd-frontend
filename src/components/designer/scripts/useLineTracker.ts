import { onBeforeUnmount, onMounted } from 'vue';

type FrameCallback = () => void;

const callbacks = new Set<FrameCallback>();
let rafId: number | undefined;

function tick() {
  for (const cb of callbacks) {
    cb();
  }
  rafId = requestAnimationFrame(tick);
}

function start() {
  if (rafId === undefined) {
    rafId = requestAnimationFrame(tick);
  }
}

function stop() {
  if (rafId !== undefined) {
    cancelAnimationFrame(rafId);
    rafId = undefined;
  }
}

export function useLineTracker(callback: FrameCallback) {
  onMounted(() => {
    callbacks.add(callback);
    start();
  });

  onBeforeUnmount(() => {
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      stop();
    }
  });
}
