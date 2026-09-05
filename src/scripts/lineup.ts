import { observeMotion } from './motion';

const poster = document.querySelector<HTMLElement>('.artist-poster');
if (poster) {
  const backdrop = poster.querySelector<HTMLElement>('.artist-backdrop')!;
  const cloud = poster.querySelector<HTMLElement>('.heart-cloud')!;
  const heart = poster.querySelector<HTMLButtonElement>('.ritual-heart')!;
  const colors = ['#ff6abe', '#e6f191', '#ad9eff', '#86e6dc', '#ffb98e'];
  const particles = new Map<HTMLElement, Animation>();
  let active = false,
    frame = 0,
    lastHeart = 0;
  let pointer = { x: 0, y: 0 };
  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];
  function burst(x: number, y: number, count: number) {
    if (!active) return;
    const rect = poster!.getBoundingClientRect();
    for (let i = 0; i < count && particles.size < 18; i++) {
      const particle = document.createElement('span');
      particle.textContent = '♥';
      particle.style.left = `${x - rect.left}px`;
      particle.style.top = `${y - rect.top}px`;
      particle.style.color = randomColor();
      particle.style.fontSize = `${18 + Math.random() * 23}px`;
      cloud.append(particle);
      const animation = particle.animate(
        [
          {
            transform: 'translate(-50%, -50%) scale(.5) rotate(0deg)',
            opacity: 0,
          },
          { opacity: 1, offset: 0.12 },
          {
            transform: `translate(calc(-50% + ${(Math.random() - 0.5) * 220}px), -${100 + Math.random() * 110}px) scale(1.15) rotate(${(Math.random() - 0.5) * 65}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 1100 + Math.random() * 650,
          easing: 'cubic-bezier(.16,.55,.4,1)',
        },
      );
      particles.set(particle, animation);
      animation.onfinish = () => {
        particles.delete(particle);
        particle.remove();
      };
    }
  }
  observeMotion(poster, (value) => {
    active = value;
    poster.dataset.motionActive = String(value);
    if (!value) {
      cancelAnimationFrame(frame);
      frame = 0;
      backdrop.style.transform = '';
      particles.forEach((animation, particle) => {
        animation.cancel();
        particle.remove();
      });
      particles.clear();
    }
  });
  heart.hidden = false;
  heart.addEventListener('click', () => {
    heart.style.color = randomColor();
    const rect = heart.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top, 12);
  });
  poster
    .querySelectorAll<HTMLAnchorElement>('.artist-list a')
    .forEach((link) => {
      const show = (event: PointerEvent | FocusEvent) => {
        link.style.setProperty('--artist-color', randomColor());
        if (link.dataset.image) {
          backdrop.style.backgroundImage = `url("${link.dataset.image}")`;
          backdrop.classList.add('visible');
        }
        const rect = link.getBoundingClientRect();
        const x =
          event instanceof PointerEvent
            ? event.clientX
            : rect.left + rect.width / 2;
        const y =
          event instanceof PointerEvent
            ? event.clientY
            : rect.top + rect.height / 2;
        burst(x, y, 5);
      };
      const hide = () => backdrop.classList.remove('visible');
      link.addEventListener('pointerenter', show);
      link.addEventListener('pointerleave', hide);
      link.addEventListener('focus', show);
      link.addEventListener('blur', hide);
    });
  poster.addEventListener('pointermove', (event) => {
    if (!active || event.pointerType !== 'mouse') return;
    pointer = { x: event.clientX, y: event.clientY };
    if (frame) return;
    frame = requestAnimationFrame((time) => {
      frame = 0;
      const rect = poster.getBoundingClientRect();
      const x = (pointer.x - rect.left) / rect.width - 0.5;
      const y = (pointer.y - rect.top) / rect.height - 0.5;
      if (time - lastHeart > 110) {
        burst(pointer.x, pointer.y, 1);
        lastHeart = time;
      }
      backdrop.style.transform = `translate(${x * 22}px, ${y * 16}px) scale(1.06)`;
    });
  });
  poster.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    frame = 0;
    backdrop.style.transform = '';
  });
}
