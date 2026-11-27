/**
 * iPhone haptics. Safari has no Vibration API; the only Taptic hook is a native
 * <input type="checkbox" switch> that ticks when a finger lands on it. Since iOS 26.5 a
 * script-made click on such a switch no longer ticks, so every tappable control gets an
 * invisible switch laid over it: the tap lands on the switch (haptic) and is forwarded
 * to the real control. Taps that begin on the overlay still reach React handlers such as
 * onPointerDown, because pointer events bubble from the switch up to its button.
 */
const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
export const isIOS =
  /iP(hone|od|ad)/.test(ua) || (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

let lastOverlayTick = 0;
/** True just after an overlay switch ticked, so the script fallback can stay quiet instead of doubling up. */
export const overlayTickedRecently = (): boolean => Date.now() - lastOverlayTick < 300;

const HOSTS = "button, a[href]";
// The scrim is a full-screen button behind the sheet: its overlay would sit on top of the sheet and eat every tap.
const SKIP = "[data-no-hx], .sheet-scrim";

export function mountIosHaptics(): void {
  if (typeof document === "undefined" || !isIOS || typeof navigator.vibrate === "function") return;
  let queued = false;
  const decorate = (): void => {
    queued = false;
    document.querySelectorAll<HTMLElement>(HOSTS).forEach(host => {
      if (host.querySelector(":scope > .hx") || host.closest(SKIP)) return;
      if ((host as HTMLButtonElement).disabled || host.getAttribute("aria-disabled") === "true") return;
      // Inline style, not a class: React rewrites className on re-render and would drop a class, leaving
      // the overlay stretched over a distant ancestor where it steals every tap.
      if (getComputedStyle(host).position === "static") host.style.position = "relative";
      host.style.isolation = "isolate"; // keep the overlay inside its own button, never above neighbours
      const sw = document.createElement("input");
      sw.type = "checkbox";
      sw.className = "hx";
      sw.tabIndex = -1;
      sw.setAttribute("switch", "");
      sw.setAttribute("aria-hidden", "true");
      // Forward the tap to the real control exactly once, whichever event gets there first.
      let lastForward = 0;
      const forward = (): void => {
        const now = Date.now();
        if (now - lastForward < 400) return;
        lastForward = now;
        lastOverlayTick = now;
        if (!(host as HTMLButtonElement).disabled) host.click();
      };
      let from: { x: number; y: number } | null = null;
      sw.addEventListener("pointerdown", event => { from = { x: event.clientX, y: event.clientY }; });
      sw.addEventListener("pointercancel", () => { from = null; });
      sw.addEventListener("pointerup", event => {
        const start = from;
        from = null;
        if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 10) forward();
      });
      sw.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        forward();
      });
      host.append(sw);
    });
  };
  const queue = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(decorate);
  };
  new MutationObserver(queue).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["disabled", "aria-disabled"]
  });
  decorate();
}
