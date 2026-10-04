import { AppState, Platform } from 'react-native';

/** Coalesce visibility/focus/resume bursts; remove listeners on scope cleanup. */
export function subscribeFinanceResume(refresh: () => Promise<void>): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let live = true;
  const schedule = () => {
    if (!live || timer !== undefined) return;
    timer = setTimeout(() => {
      timer = undefined;
      if (live) void refresh();
    }, 250);
  };
  let previous = AppState.currentState;
  const subscription = AppState.addEventListener('change', (next) => {
    if (next === 'active' && previous !== 'active') schedule();
    previous = next;
  });
  const visible = () => { if (document.visibilityState === 'visible') schedule(); };
  const focused = () => { if (document.visibilityState === 'visible') schedule(); };
  if (Platform.OS === 'web') {
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('focus', focused);
  }
  return () => {
    live = false;
    if (timer !== undefined) clearTimeout(timer);
    subscription.remove();
    if (Platform.OS === 'web') {
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('focus', focused);
    }
  };
}
