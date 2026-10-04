import { afterEach, expect, jest, test } from '@jest/globals';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { subscribeFinanceResume } from '../financeLifecycle';
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

test('native resume and web visibility/focus bursts schedule one request and clean up', async () => {
  jest.useFakeTimers();
  const refresh = jest.fn(async () => {});
  const remove = jest.fn();
  let change: (state: AppStateStatus) => void = () => {};
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_name, listener) => { change = listener; return { remove }; });
  const previousPlatform = Object.getOwnPropertyDescriptor(Platform, 'OS');
  Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  const doc = new EventTarget();
  Object.defineProperty(doc, 'visibilityState', { value: 'visible', configurable: true });
  const browser = new EventTarget();
  const previousDoc = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'document', { value: doc, configurable: true });
  Object.defineProperty(globalThis, 'window', { value: browser, configurable: true });
  try {
    expect(Platform.OS).toBe('web');
    const stop = subscribeFinanceResume(refresh);
    change('background'); change('active'); doc.dispatchEvent(new Event('visibilitychange')); browser.dispatchEvent(new Event('focus'));
    jest.advanceTimersByTime(250);
    expect(refresh).toHaveBeenCalledTimes(1);
    Object.defineProperty(doc, 'visibilityState', { value: 'hidden', configurable: true });
    browser.dispatchEvent(new Event('focus')); jest.advanceTimersByTime(250);
    expect(refresh).toHaveBeenCalledTimes(1);
    change('background'); change('active'); stop(); jest.advanceTimersByTime(250);
    expect(refresh).toHaveBeenCalledTimes(1); expect(remove).toHaveBeenCalledTimes(1);
  } finally {
    if (previousPlatform) Object.defineProperty(Platform, 'OS', previousPlatform);
    if (previousDoc) Object.defineProperty(globalThis, 'document', previousDoc); else Reflect.deleteProperty(globalThis, 'document');
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else Reflect.deleteProperty(globalThis, 'window');
  }
});
