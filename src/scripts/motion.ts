const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = false;
try {
  paused = sessionStorage.getItem('dango-motion-paused') === 'true';
} catch {
  /* Storage is optional. */
}

type MotionState = { enabled: boolean; active: boolean };
const listeners = new Set<(state: MotionState) => void>();
let previous = '';
export const motionState = (): MotionState => ({
  enabled: !reduced.matches && !paused,
  active:
    !reduced.matches &&
    !paused &&
    !document.hidden &&
    !root.classList.contains('modal-open'),
});
const toggle = document.querySelector<HTMLButtonElement>(
  '[data-motion-toggle]',
);
function update() {
  const state = motionState();
  root.dataset.motionPaused = String(!state.enabled);
  if (toggle) {
    toggle.hidden = reduced.matches;
    toggle.setAttribute(
      'aria-label',
      paused ? 'Reanudar animaciones' : 'Pausar animaciones',
    );
    toggle.title = toggle.getAttribute('aria-label')!;
    toggle.querySelector('span')!.textContent = paused ? '▶' : 'Ⅱ';
  }
  const key = `${state.enabled}:${state.active}`;
  if (key === previous) return;
  previous = key;
  listeners.forEach((listener) => listener(state));
}
export function onMotionChange(listener: (state: MotionState) => void) {
  listeners.add(listener);
  listener(motionState());
}
const visible = new Map<
  Element,
  { inside: boolean; change: (active: boolean) => void }
>();
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const item = visible.get(entry.target)!;
    item.inside = entry.isIntersecting;
    item.change(item.inside && motionState().active);
  });
});
export function observeMotion(
  element: HTMLElement,
  change: (active: boolean) => void,
) {
  visible.set(element, { inside: false, change });
  change(false);
  observer.observe(element);
}
onMotionChange(({ active }) =>
  visible.forEach((item) => item.change(active && item.inside)),
);
reduced.addEventListener('change', update);
document.addEventListener('visibilitychange', update);
new MutationObserver(update).observe(root, {
  attributes: true,
  attributeFilter: ['class'],
});
toggle?.addEventListener('click', () => {
  paused = !paused;
  try {
    sessionStorage.setItem('dango-motion-paused', String(paused));
  } catch {
    /* Optional. */
  }
  update();
});
update();
