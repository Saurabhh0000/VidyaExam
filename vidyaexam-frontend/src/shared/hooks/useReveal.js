import { useEffect } from 'react';

/** Adds .is-visible once to every [data-reveal] element inside ref. Observer is cleaned up. */
export function useReveal(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const items = root.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ref]);
}