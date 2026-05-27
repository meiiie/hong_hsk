import { createInitialState } from "../../application/bootstrap/initial-state";
import { enrichVietnameseMeanings } from "../../application/vocab/data-enrichment";
import { APP_DATA_SCHEMA_VERSION, INDEXEDDB_SCHEMA_VERSION } from "../../domain/app-version";
import { HSK4_EXCEL_SOURCE, createExcelCourseItems } from "../../domain/hsk4/hsk4-excel-vocab";
import { normalizeLocale } from "../../domain/locale";
import type { AppState, Attempt, ReviewState, VocabItem } from "../../domain/types";

// Keep the legacy IndexedDB name so existing learners do not lose local progress after the product rename.
const DB_NAME = "hsk4-review-pwa";
const DB_VERSION = INDEXEDDB_SCHEMA_VERSION;
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
  const shouldReplaceItems = shouldUseBundledExcelItems(state.items);
  const items = shouldReplaceItems ? createExcelCourseItems() : state.items;
  const learningData = shouldReplaceItems
    ? migrateLearningData(state.items, items, state)
    : { attempts: state.attempts, reviews: state.reviews };
  const next: AppState = {
    ...state,
    version: APP_DATA_SCHEMA_VERSION,
    items: enrichVietnameseMeanings(items),
    attempts: learningData.attempts,
    reviews: learningData.reviews,
    settings: {
      ...settings,
      displayName: settings.displayName?.trim() || "Hồng",
      avatarInitial: settings.avatarInitial?.trim().slice(0, 2).toUpperCase() || "H",
      locale: normalizeLocale(settings.locale),
      useEnglishFallback: settings.useEnglishFallback ?? false,
      revealPinyin: settings.revealPinyin ?? true,
      revealMeaning: settings.revealMeaning ?? true,
    },
  };

  if (
    next.settings.locale === settings.locale &&
    next.settings.displayName === settings.displayName &&
    next.settings.avatarInitial === settings.avatarInitial &&
    next.settings.useEnglishFallback === settings.useEnglishFallback &&
    next.settings.revealPinyin === settings.revealPinyin &&
    next.settings.revealMeaning === settings.revealMeaning &&
    next.version === state.version &&
    next.items === state.items &&
    next.attempts === state.attempts &&
    next.reviews === state.reviews
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

function shouldUseBundledExcelItems(items: VocabItem[]): boolean {
  if (!items.length) {
    return true;
  }

  if (items.every((item) => item.source.startsWith(HSK4_EXCEL_SOURCE))) {
    return false;
  }

  return items.every(
    (item) =>
      item.source.startsWith("HSK Standard Course reference CSV") ||
      item.source.startsWith("Starter demo"),
  );
}

function migrateLearningData(
  previousItems: VocabItem[],
  nextItems: VocabItem[],
  state: AppState,
): Pick<AppState, "attempts" | "reviews"> {
  const idMap = buildItemIdMap(previousItems, nextItems);
  const reviews: Record<string, ReviewState> = {};

  Object.entries(state.reviews).forEach(([itemId, review]) => {
    const nextId = idMap.get(itemId);
    if (!nextId) {
      return;
    }

    const migrated = { ...review, itemId: nextId };
    const existing = reviews[nextId];
    reviews[nextId] = existing ? newestReview(existing, migrated) : migrated;
  });

  const attempts = state.attempts
    .map((attempt): Attempt | undefined => {
      const nextId = idMap.get(attempt.itemId);
      return nextId ? { ...attempt, itemId: nextId } : undefined;
    })
    .filter((attempt): attempt is Attempt => Boolean(attempt));

  return { attempts, reviews };
}

function buildItemIdMap(previousItems: VocabItem[], nextItems: VocabItem[]): Map<string, string> {
  const nextIdByKey = new Map(nextItems.map((item) => [itemKey(item), item.id]));
  const idMap = new Map<string, string>();

  previousItems.forEach((item) => {
    const nextId = nextIdByKey.get(itemKey(item));
    if (nextId) {
      idMap.set(item.id, nextId);
    }
  });

  return idMap;
}

function itemKey(item: VocabItem): string {
  return `${item.lesson}:${item.hanzi}`;
}

function newestReview(left: ReviewState, right: ReviewState): ReviewState {
  if (right.lastReviewed > left.lastReviewed) {
    return right;
  }
  if (right.lastReviewed === left.lastReviewed && right.totalAttempts > left.totalAttempts) {
    return right;
  }
  return left;
}
