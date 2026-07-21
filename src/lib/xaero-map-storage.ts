import type { XaeroMapCalibration } from "@/lib/xaero-map";

const DATABASE_NAME = "minecolonies-planner-maps";
const STORE_NAME = "xaero-maps";
const ACTIVE_MAP_ID = "active";

export type StoredXaeroMap = {
  blob: Blob;
  calibration: XaeroMapCalibration;
};

type StoredXaeroMapRecord = StoredXaeroMap & { id: string };

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function completeTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function readStoredXaeroMap(): Promise<StoredXaeroMap | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction
      .objectStore(STORE_NAME)
      .get(ACTIVE_MAP_ID) as IDBRequest<StoredXaeroMapRecord | undefined>;
    const record = await new Promise<StoredXaeroMapRecord | undefined>(
      (resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );
    return record
      ? { blob: record.blob, calibration: record.calibration }
      : null;
  } finally {
    database.close();
  }
}

export async function writeStoredXaeroMap(map: StoredXaeroMap): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ id: ACTIVE_MAP_ID, ...map });
    await completeTransaction(transaction);
  } finally {
    database.close();
  }
}

export async function deleteStoredXaeroMap(): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(ACTIVE_MAP_ID);
    await completeTransaction(transaction);
  } finally {
    database.close();
  }
}
