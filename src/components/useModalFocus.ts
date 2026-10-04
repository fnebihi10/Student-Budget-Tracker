import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/** RN's web Modal traps focus but does not reliably restore a pointer trigger. */
export function useModalFocus(visible: boolean): void {
  const trigger = useRef<HTMLElement | null>(null);
  const opened = useRef(false);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (visible) { opened.current = true; return; }
    const previous = trigger.current;
    // Wait for the fade and web Modal's focus scope to be removed.
    const timer = opened.current ? setTimeout(() => {
      if (previous?.isConnected) previous.focus();
    }, 300) : undefined;
    opened.current = false;
    const remember = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest('button,[role="button"]');
      if (button instanceof HTMLElement) trigger.current = button;
    };
    document.addEventListener('pointerdown', remember, true);
    document.addEventListener('focusin', remember, true);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener('pointerdown', remember, true);
      document.removeEventListener('focusin', remember, true);
    };
  }, [visible]);
}
