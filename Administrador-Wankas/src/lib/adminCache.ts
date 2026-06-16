/**
 * Caché en memoria del lado del cliente.
 * Vive mientras la pestaña del navegador esté abierta.
 * Elimina completamente los fetches redundantes entre secciones del dashboard.
 */

type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

// TTL en milisegundos — si el dato tiene más de este tiempo, se revalida en background
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutos

const store = new Map<string, CacheEntry<unknown>>();

export const adminCache = {
  get<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > ttlMs) {
      store.delete(key);
      return null;
    }
    return entry.data;
  },

  set<T>(key: string, data: T): void {
    store.set(key, { data, fetchedAt: Date.now() });
  },

  invalidate(key: string): void {
    store.delete(key);
  },

  invalidateAll(): void {
    store.clear();
  },
};
