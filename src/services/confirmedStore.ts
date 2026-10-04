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
  private loading: Promise<void> | null = null;
  private refreshAfterWrite = false;
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
    this.loading = null;
    this.refreshAfterWrite = false;
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
  load = (): Promise<void> => {
    if (!this.live) return Promise.resolve();
    if (this.loading) return this.loading;
    if (this.busy) {
      this.refreshAfterWrite = true;
      return Promise.resolve();
    }
    const request = this.performLoad();
    this.loading = request;
    void request.finally(() => { if (this.loading === request) this.loading = null; });
    return request;
  };
  private async performLoad(): Promise<void> {
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
  async mutate(recipe: (current: T) => T, persist?: (before: T, after: T) => Promise<void>): Promise<boolean> {
    if (!this.live || this.busy) return false;
    if (!this.snapshot.verified) {
      this.publish({ error: this.options.demo ? 'Reload the saved demo before editing. Your draft is kept.' : 'Load your cloud records before editing. Reconnect and retry.' });
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
      else await (persist ?? this.options.persist)(before, after);
      if (!this.live || generation !== this.generation) return false;
      this.publish({ data: after, status: 'synced' });
      if (!this.options.demo) this.cache(before, after);
      return true;
    } catch (error) {
      recordDiagnostic('cloud_write_unconfirmed');
      if (this.live && generation === this.generation) {
        // Outcome may be ambiguous (server committed but response lost). Read
        // before another write, never automatically replay a financial action.
        const conflict = error !== null && typeof error === 'object' && 'code' in error && error.code === 'PGRST116';
        const alreadyRecorded = error !== null && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.startsWith('Payment already recorded');
        this.publish({ status: 'failed', verified: false, error: this.options.demo ? 'Demo save failed. Values were kept. Reload saved demo data before retrying.' : alreadyRecorded ? 'Payment already recorded. Reload, review transaction history, then use the paid checkbox to update tracking without another expense.' : conflict ? 'This record changed or was deleted on another device. Your draft is kept. Reload, then close and reopen the editor to review the latest version.' : 'Save was not confirmed. Values were kept. Reconnect and reload before retrying.' });
      }
      return false;
    } finally {
      if (generation === this.generation) {
        this.busy = false;
        if (this.refreshAfterWrite && this.live) {
          this.refreshAfterWrite = false;
          await this.load();
        }
      }
    }
  }
}

