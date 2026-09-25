/**
 * Macht ein klickbares Element, das selbst Buttons enthält und daher kein <button> sein kann,
 * per Tab erreichbar und mit Enter oder Leertaste auslösbar.
 * @param {() => void} onClick
 */
export function klickbarPerTastatur(onClick) {
  return {
    tabIndex: 0,
    onClick,
    onKeyDown: e => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
  };
}

export const FOKUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400';
