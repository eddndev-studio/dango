import Lenis from 'lenis';
import { onMotionChange, motionState } from './motion';

let lenis: Lenis | undefined;
let frame = 0;
const cancel = () => {
  cancelAnimationFrame(frame);
  frame = 0;
};
function tick(time: number) {
  frame = 0;
  if (!lenis || !motionState().active) return;
  lenis.raf(time);
  if (lenis.isScrolling === 'smooth') wake();
}
// Wake only for input or an active scroll, instead of an idle, permanent RAF loop.
function wake() {
  if (!frame && lenis && motionState().active)
    frame = requestAnimationFrame(tick);
}
onMotionChange(({ enabled, active }) => {
  if (!enabled) {
    cancel();
    lenis?.destroy();
    lenis = undefined;
    return;
  }
  if (!lenis) {
    lenis = new Lenis({
      lerp: 0.085,
      autoRaf: false,
      syncTouch: false,
      prevent: (node) => node instanceof HTMLDialogElement,
    });
    lenis.on('virtual-scroll', () => {
      // Reset Lenis' clock before input starts a new animation after an idle gap.
      if (!frame) lenis?.raf(performance.now());
      wake();
    });
  }
  if (active) lenis.start();
  else {
    lenis.stop();
    cancel();
  }
});

document.addEventListener('click', (event) => {
  if (
    !lenis ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const link =
    event.target instanceof Element
      ? event.target.closest<HTMLAnchorElement>('a[href]')
      : null;
  if (!link || link.target || link.hasAttribute('download')) return;
  const url = new URL(link.href);
  if (
    url.origin !== location.origin ||
    url.pathname !== location.pathname ||
    url.search !== location.search ||
    !url.hash
  )
    return;
  let target: HTMLElement | null;
  try {
    target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  } catch {
    return;
  }
  if (!target || document.querySelector('dialog[open]')) return;
  event.preventDefault();
  // Menu links close their dialog before this event reaches the document.
  lenis.start();
  lenis.resize();
  if (!frame) lenis.raf(performance.now());
  lenis.scrollTo(target, {
    duration: 1.1,
    onComplete: () => {
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener(
          'blur',
          () => target.removeAttribute('tabindex'),
          { once: true },
        );
      }
      target.focus({ preventScroll: true });
    },
  });
  if (location.hash !== url.hash) history.pushState(null, '', url.hash);
  wake();
});
// Native keyboard navigation and browser history interrupt any remaining inertia.
window.addEventListener('popstate', () => {
  lenis?.stop();
  lenis?.start();
});
document.addEventListener('keydown', (event) => {
  if (
    [
      'Tab',
      'Home',
      'End',
      'PageUp',
      'PageDown',
      'ArrowUp',
      'ArrowDown',
      ' ',
    ].includes(event.key) &&
    lenis &&
    motionState().active
  ) {
    lenis.stop();
    lenis.start();
    cancel();
  }
});
