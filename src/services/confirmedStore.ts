import { recordDiagnostic } from './diagnostics';

export type SyncStatus = 'loading' | 'pending' | 'failed' | 'synced';
export type Snapshot<T> = { data: T; status: SyncStatus; error: string; verified: boolean; initialized: boolean };
export type StoreOptions<T> = {
  initial: T;
  load: () => Promise<T>;
  cache: (before: T | null, after: T) => Promise<void>;
  persist: (before: T, after: T) => Promise<void>;
  demo: boolean;
};

const active = new Map<() => void, () => Promise<void>>();
// Called synchronously at every auth boundary, before React renders a new scope.
export function invalidateFinanceStores(): Promise<void> {
  const drains = [...active.values()].map((drain) => drain());
  for (const invalidate of active.keys()) invalidate();
  return Promise.all(drains).then(() => {});
}

/** Confirmed-write store. No optimistic cloud edits or offline mutation queue. */
export class ConfirmedStore<T> {
  private generation = 0;
  private live = true;
  private busy = false;
  private listeners = new Set<() => void>();
  private cacheTail: Promise<void> = Promise.resolve();
  private snapshot: Snapshot<T>;
  constructor(private options: StoreOptions<T>) {
    this.snapshot = { data: options.initial, status: 'loading', error: '', verified: false, initialized: false };
    active.set(this.invalidate, () => this.cacheTail);
  }
  getSnapshot = (): Snapshot<T> => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  activate(): void {
    if (this.live) return;
    this.live = true;
    active.set(this.invalidate, () => this.cacheTail);
  }
  private publish(patch: Partial<Snapshot<T>>): void {
    if (!this.live) return;
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener();
  }
  invalidate = (): void => {
    this.live = false;
    this.busy = false;
    this.generation++;
    active.delete(this.invalidate);
    this.listeners.clear();
  };
  private cache(before: T | null, after: T): void {
    const generation = this.generation;
    this.cacheTail = this.cacheTail.then(async () => {
      if (!this.live || generation !== this.generation) return;
      await this.options.cache(before, after);
    }).catch(() => {
      recordDiagnostic('cache_failed');
      this.publish({ error: 'Confirmed changes could not be cached on this device.' });
    });
  }
  async load(): Promise<void> {
    if (!this.live || this.busy) return;
    const generation = ++this.generation;
    this.busy = true;
    this.publish({ status: 'loading', error: '', verified: false });
    try {
      const data = await this.options.load();
      if (!this.live || generation !== this.generation) return;
      this.publish({ data, status: 'synced', verified: true, initialized: true });
      this.cache(null, data);
    } catch {
      recordDiagnostic('cloud_load_failed');
      if (this.live && generation === this.generation) {
        this.publish({ status: 'failed', error: this.options.demo ? 'Demo cache could not be read. Retry loading the saved demo.' : 'Cloud load failed. Editing is disabled; reconnect and retry.', verified: false, initialized: true });
      }
    } finally {
      if (generation === this.generation) this.busy = false;
    }
  }
  async mutate(recipe: (current: T) => T): Promise<boolean> {
    if (!this.live || this.busy) return false;
    if (!this.snapshot.verified) {
      this.publish({ error: 'Load your cloud records before editing. Reconnect and retry.' });
      return false;
    }
    const generation = this.generation;
    const before = this.snapshot.data;
    let after: T;
    try { after = recipe(before); }
    catch (error) {
      this.publish({ error: error instanceof Error ? error.message : 'Invalid change.' });
      return false;
    }
    if (after === before) return false;
    this.busy = true;
    this.publish({ status: 'pending', error: '' });
    try {
      if (this.options.demo) await this.options.cache(before, after);
      else await this.options.persist(before, after);
      if (!this.live || generation !== this.generation) return false;
      this.publish({ data: after, status: 'synced' });
      if (!this.options.demo) this.cache(before, after);
      return true;
    } catch {
      recordDiagnostic('cloud_write_unconfirmed');
      if (this.live && generation === this.generation) {
        // Outcome may be ambiguous (server committed but response lost). Read
        // before another write, never automatically replay a financial action.
        this.publish({ status: 'failed', verified: false, error: this.options.demo ? 'Demo save failed. Values were kept. Reload saved demo data before retrying.' : 'Save was not confirmed. Values were kept. Reconnect and reload before retrying.' });
      }
      return false;
    } finally {
      if (generation === this.generation) this.busy = false;
    }
  }
}

