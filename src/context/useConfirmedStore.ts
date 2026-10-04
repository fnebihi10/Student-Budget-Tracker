import { useRequiredContext as useContext } from './requiredContext';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AuthContext } from './AuthContext';
import { ConfirmedStore } from '../services/confirmedStore';
import { readDemoCache, writeCache } from '../services/scopedCache';
import { subscribeFinanceResume } from '../services/financeLifecycle';
import type { User } from '@supabase/supabase-js';
import { demoShape } from '../services/decoders';

export function useConfirmedStore<T>(feature: string, initial: T, demo: T, load: (user: User) => Promise<T>, persist: (userId: string, before: T, after: T) => Promise<void>) {
  const { user, isDemo, isRecovering } = useContext(AuthContext);
  const scope = isRecovering ? 'signed-out' : isDemo ? 'demo' : user ? `user/${user.id}` : 'signed-out';
  // App remounts the entire finance subtree when this scope changes.
  const [store] = useState(() => new ConfirmedStore<T>({
    initial: isDemo ? demo : initial,
    demo: isDemo,
    load: () => isRecovering ? Promise.resolve(initial) : isDemo ? readDemoCache(scope, feature, demo, (value) => demoShape(value, demo)) : user ? load(user) : Promise.resolve(initial),
    cache: (before, after) => scope === 'signed-out' ? Promise.resolve() : writeCache(scope, feature, before, after),
    persist: (before, after) => {
      if (!user) throw new Error('Authentication required');
      return persist(user.id, before, after);
    },
  }));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const refreshOnResume = Boolean(user) && !isDemo && !isRecovering;
  useEffect(() => {
    store.activate();
    void store.load();
    const unsubscribe = refreshOnResume ? subscribeFinanceResume(store.load) : () => {};
    return () => { unsubscribe(); store.invalidate(); };
  }, [store, refreshOnResume]);
  const actions = useMemo(() => ({ mutate: store.mutate.bind(store), retry: store.load.bind(store) }), [store]);
  return { ...snapshot, ...actions };
}
