import { onBeforeUnmount, onMounted } from 'vue';

type FrameCallback = () => void;

const callbacks = new Set<FrameCallback>();
let rafId: number | undefined;
let idleTimer: ReturnType<typeof setTimeout> | undefined;
let listenersAttached = false;

const IDLE_TIMEOUT_MS = 200;

function tick() {
  for (const cb of callbacks) {
    cb();
  }
  rafId = requestAnimationFrame(tick);
}

function start() {
  if (rafId === undefined && callbacks.size > 0) {
    rafId = requestAnimationFrame(tick);
  }
}

function stop() {
  if (rafId !== undefined) {
    cancelAnimationFrame(rafId);
    rafId = undefined;
  }
}

function onActivity() {
  if (callbacks.size === 0) return;
  start();
  if (idleTimer !== undefined) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    for (const cb of callbacks) cb();
    stop();
    idleTimer = undefined;
  }, IDLE_TIMEOUT_MS);
}

function attachListeners() {
  if (listenersAttached) return;
  document.addEventListener('pointermove', onActivity, { passive: true });
  document.addEventListener('scroll', onActivity, { passive: true, capture: true });
  window.addEventListener('resize', onActivity, { passive: true });
  listenersAttached = true;
}

function detachListeners() {
  if (!listenersAttached) return;
  document.removeEventListener('pointermove', onActivity);
  document.removeEventListener('scroll', onActivity, { capture: true });
  window.removeEventListener('resize', onActivity);
  listenersAttached = false;
}

export function useLineTracker(callback: FrameCallback) {
  onMounted(() => {
    callbacks.add(callback);
    attachListeners();
    // Initial calculation
    onActivity();
  });

  onBeforeUnmount(() => {
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      stop();
      if (idleTimer !== undefined) {
        clearTimeout(idleTimer);
        idleTimer = undefined;
      }
      detachListeners();
    }
  });
}
