import { useEffect, useRef } from 'react';

const isTyping = (el) =>
  el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

/**
 * Keyboard shortcuts. Keys: 'n', '?', '1', 'mod+z' (Ctrl or Cmd).
 * Plain keys are ignored while typing in a field.
 *   useHotkeys({ n: openForm, 'mod+z': undo });
 */
export function useHotkeys(bindings, enabled = true) {
  const ref = useRef(bindings);
  ref.current = bindings;

  useEffect(() => {
    if (!enabled) return undefined;
    const onKeyDown = (event) => {
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      const combo = mod ? `mod+${key}` : key;
      const handler = ref.current[combo];
      if (!handler) return;
      if (!mod && isTyping(document.activeElement)) return;
      if (event.altKey) return;
      event.preventDefault();
      handler(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
