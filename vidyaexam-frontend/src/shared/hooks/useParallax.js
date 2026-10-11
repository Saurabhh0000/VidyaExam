import { useEffect } from 'react';

/**
 * One passive scroll listener + requestAnimationFrame, no React state.
 * Elements with data-speed="0.1" get --py (px); CSS applies the transform.
 * Disabled for reduced motion and screens narrower than 768px.
 */
export function useParallax(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wide = window.matchMedia('(min-width: 768px)');
    const layers = Array.from(root.querySelectorAll('[data-speed]'));
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      layers.forEach((el) => {
        const speed = parseFloat(el.dataset.speed) || 0;
        const px = Math.max(-40, Math.min(40, y * speed));
        el.style.setProperty('--py', `${px.toFixed(1)}px`);
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const reset = () => layers.forEach((el) => el.style.removeProperty('--py'));
    const sync = () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (reduce.matches || !wide.matches) return reset();
      window.addEventListener('scroll', onScroll, { passive: true });
      return update();
    };

    sync();
    reduce.addEventListener('change', sync);
    wide.addEventListener('change', sync);
    return () => {
      window.removeEventListener('scroll', onScroll);
      reduce.removeEventListener('change', sync);
      wide.removeEventListener('change', sync);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
}