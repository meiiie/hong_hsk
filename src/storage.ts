import type { AppState } from "./types";
import { createInitialState } from "./seed";
import { normalizeLocale } from "./i18n";
import { enrichVietnameseMeanings } from "./data-enrichment";

// Keep the legacy IndexedDB name so existing learners do not lose local progress after the product rename.
const DB_NAME = "hsk4-review-pwa";
const DB_VERSION = 1;
const STORE_NAME = "app-state";
const STATE_KEY = "current";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function loadState(): Promise<AppState> {
  const stored = await withStore<AppState | undefined>("readonly", (store) =>
    store.get(STATE_KEY),
  );

  if (stored?.version) {
    const migrated = migrateState(stored);
    if (migrated !== stored) {
      await saveState(migrated);
    }
    return migrated;
  }

  const initialState = createInitialState();
  await saveState(initialState);
  return initialState;
}

function migrateState(state: AppState): AppState {
  const settings = state.settings ?? createInitialState().settings;
  const next: AppState = {
    ...state,
    items: enrichVietnameseMeanings(state.items),
    settings: {
      ...settings,
      locale: normalizeLocale(settings.locale),
      useEnglishFallback: settings.useEnglishFallback ?? false,
      revealPinyin: settings.revealPinyin ?? true,
      revealMeaning: settings.revealMeaning ?? true,
    },
  };

  if (
    next.settings.locale === settings.locale &&
    next.settings.useEnglishFallback === settings.useEnglishFallback &&
    next.settings.revealPinyin === settings.revealPinyin &&
    next.settings.revealMeaning === settings.revealMeaning &&
    next.items === state.items
  ) {
    return state;
  }

  return next;
}

export async function saveState(state: AppState): Promise<void> {
  const nextState: AppState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  await withStore<IDBValidKey>("readwrite", (store) =>
    store.put(nextState, STATE_KEY),
  );
}

export async function resetState(): Promise<AppState> {
  const initialState = createInitialState();
  await saveState(initialState);
  return initialState;
}
