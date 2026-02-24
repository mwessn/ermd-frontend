import { onMounted, onUnmounted } from "vue";

const FOCUSABLE_SELECTOR = '[tabindex]:not([tabindex="-1"]), input:not([disabled])';

function focusItem(el: Element): void {
  if (el instanceof HTMLElement && el.tabIndex >= 0) {
    el.focus();
    return;
  }
  const child = el.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  child?.focus();
}

export function focusFirstInGroup(group: string): void {
  const first = document.querySelector<HTMLElement>(`[data-focus-group="${group}"]`);
  if (first) focusItem(first);
}

function handleKeydown(event: KeyboardEvent): void {
  const active = document.activeElement;
  if (!active) return;

  // Input guard — let arrow keys control cursor/value inside inputs
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;

  const groupEl = active.closest<HTMLElement>("[data-focus-group]");
  if (!groupEl) return;

  const group = groupEl.dataset.focusGroup!;
  const type = groupEl.dataset.focusType ?? "vertical";

  const isBack =
    (type === "vertical" && event.key === "ArrowUp") ||
    (type === "horizontal" && event.key === "ArrowLeft");
  const isForward =
    (type === "vertical" && event.key === "ArrowDown") ||
    (type === "horizontal" && event.key === "ArrowRight");

  if (!isBack && !isForward) return;

  event.preventDefault();

  const items = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-focus-group="${group}"]`)
  );
  const currentIndex = items.indexOf(groupEl);

  if (isBack) {
    if (currentIndex > 0) {
      focusItem(items[currentIndex - 1]);
    } else {
      const escape = groupEl.dataset.focusEscapeBack;
      if (escape) document.querySelector<HTMLElement>(escape)?.focus();
    }
  } else {
    if (currentIndex < items.length - 1) {
      focusItem(items[currentIndex + 1]);
    } else {
      const escape = groupEl.dataset.focusEscapeForward;
      if (escape) document.querySelector<HTMLElement>(escape)?.focus();
    }
  }
}

export function useFocusGroup(): void {
  onMounted(() => document.addEventListener("keydown", handleKeydown));
  onUnmounted(() => document.removeEventListener("keydown", handleKeydown));
}
