import { onBeforeUnmount, onMounted } from 'vue';

type FrameCallback = () => void;

const callbacks = new Set<FrameCallback>();
let rafId: number | null = null;

function tick() {
  for (const cb of callbacks) {
    cb();
  }
  rafId = requestAnimationFrame(tick);
}

function start() {
  if (rafId === null) {
    rafId = requestAnimationFrame(tick);
  }
}

function stop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
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
