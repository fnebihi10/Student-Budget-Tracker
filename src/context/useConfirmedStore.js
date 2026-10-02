import { useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AuthContext } from './AuthContext';
import { ConfirmedStore } from '../services/confirmedStore';
import { readDemoCache, writeCache } from '../services/scopedCache';

export function useConfirmedStore(feature, initial, demo, load, persist) {
  const { user, isDemo, isRecovering } = useContext(AuthContext);
  const scope = isRecovering ? 'signed-out' : isDemo ? 'demo' : user ? `user/${user.id}` : 'signed-out';
  // App remounts the entire finance subtree when this scope changes.
  const [store] = useState(() => new ConfirmedStore({
    initial: isDemo ? demo : initial,
    demo: isDemo,
    load: () => isRecovering ? Promise.resolve(initial) : isDemo ? readDemoCache(scope, feature, demo) : user ? load(user) : Promise.resolve(initial),
    cache: (before, after) => scope === 'signed-out' ? Promise.resolve() : writeCache(scope, feature, before, after),
    persist: (before, after) => {
      if (!user) throw new Error('Authentication required');
      return persist(user.id, before, after);
    },
  }));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => {
    store.activate();
    void store.load();
    return () => store.invalidate();
  }, [store]);
  const actions = useMemo(() => ({ mutate: store.mutate.bind(store), retry: store.load.bind(store) }), [store]);
  return { ...snapshot, ...actions };
}
