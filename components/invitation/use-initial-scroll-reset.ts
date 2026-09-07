"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function hasExplicitHash() {
  return typeof window !== "undefined" && window.location.hash.length > 1;
}

function findScrollTarget(element: HTMLElement): HTMLElement | Window {
  let current: HTMLElement | null = element;
  while (current) {
    const overflowY = window.getComputedStyle(current).overflowY;
    const hasScrollSpace = current.scrollHeight > current.clientHeight || current.scrollWidth > current.clientWidth;
    if ((overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") && hasScrollSpace) {
      return current;
    }
    current = current.parentElement;
  }
  return window;
}

/** Keep preview and invitation surfaces at their hero until an explicit anchor is requested. */
export function useInitialScrollReset(
  ref: RefObject<HTMLElement | null>,
  options: { enabled?: boolean; resetKey?: string } = {},
) {
  const { enabled = true, resetKey = "initial" } = options;

  useIsomorphicLayoutEffect(() => {
    if (!enabled) return;
    const element = ref.current;
    if (!element) return;
    const target = findScrollTarget(element);

    const reset = () => {
      if (hasExplicitHash()) return;
      if (target === window) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } else {
        const scrollElement = target as HTMLElement;
        scrollElement.scrollTop = 0;
        scrollElement.scrollLeft = 0;
      }
    };

    reset();
    const firstFrame = window.requestAnimationFrame(reset);
    const secondFrame = window.requestAnimationFrame(() => window.requestAnimationFrame(reset));
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [enabled, ref, resetKey]);
}
