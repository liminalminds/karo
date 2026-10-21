import { useSyncExternalStore } from "react";

type StoreOptions<T> = {
  /** Unique key, used only for error messages. */
  name: string;
  initial: T;
  /** Reads persisted rows into a snapshot. Runs once at hydration. */
  load: () => Promise<T>;
  /** Writes the full snapshot back. Runs after every mutation. */
  persist: (state: T) => Promise<void>;
};

export type Store<T> = {
  /** Current value. Stable identity until the next mutation. */
  getState: () => T;
  /** False until the first load resolves. Render nothing destructive before then. */
  isReady: () => boolean;
  subscribe: (listener: () => void) => () => void;
  /** Applies a pure update, notifies subscribers, and queues a write. */
  set: (updater: (current: T) => T) => void;
  /** Loads from SQLite. Safe to call more than once. */
  hydrate: () => Promise<void>;
};

/**
 * Keeps a module-level snapshot so reads stay synchronous, and mirrors every
 * mutation into SQLite in the background. Writes are serialized through a
 * promise chain so rapid updates can't land out of order, and are held back
 * until hydration finishes so an empty initial state can't overwrite real data.
 */
export function createStore<T>(options: StoreOptions<T>): Store<T> {
  const { name, initial, load, persist } = options;

  let state = initial;
  let ready = false;
  let hydrating: Promise<void> | null = null;

  const listeners = new Set<() => void>();
  let queue: Promise<void> = Promise.resolve();
  let markReleased: () => void = () => {};
  const released = new Promise<void>((resolve) => {
    markReleased = resolve;
  });

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function set(updater: (current: T) => T) {
    const next = updater(state);
    if (next === state) return;
    state = next;
    notify();
    // Capture the snapshot now. Reading `state` when the write eventually runs
    // would persist the newest value for every queued write, silently dropping
    // the intermediate ones.
    const snapshot = next;
    queue = queue
      .then(() => released)
      .then(() => persist(snapshot))
      .catch((error) => {
        console.error(`[${name}] failed to persist`, error);
      });
  }

  async function hydrate() {
    if (hydrating) return hydrating;
    hydrating = (async () => {
      try {
        state = await load();
      } catch (error) {
        console.error(`[${name}] failed to load`, error);
      } finally {
        ready = true;
        markReleased();
        notify();
      }
    })();
    return hydrating;
  }

  return {
    getState: () => state,
    isReady: () => ready,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set,
    hydrate,
  };
}

/** Subscribes a component to a store. */
export function useStore<T>(store: Store<T>) {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/** True once the store has loaded. Render a placeholder before then. */
export function useStoreReady<T>(store: Store<T>) {
  return useSyncExternalStore(store.subscribe, store.isReady, store.isReady);
}
