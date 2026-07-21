import type { RasterMapSource } from "@/types/world-map";

const DATABASE_NAME = "minecolonies-planner-maps";
const ASSET_STORE_NAME = "map-assets";
const LEGACY_STORE_NAME = "xaero-maps";

type StoredMapAsset = {
  id: string;
  blob: Blob;
};

type LegacyXaeroRecord = {
  id: string;
  blob: Blob;
  calibration: Omit<RasterMapSource, "kind" | "assetId" | "preset">;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 2);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(ASSET_STORE_NAME)) {
        database.createObjectStore(ASSET_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function readMapAsset(assetId: string): Promise<Blob | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(ASSET_STORE_NAME, "readonly");
    const request = transaction
      .objectStore(ASSET_STORE_NAME)
      .get(assetId) as IDBRequest<StoredMapAsset | undefined>;
    return await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.blob ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export async function writeMapAsset(
  assetId: string,
  blob: Blob,
): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(ASSET_STORE_NAME, "readwrite");
    transaction.objectStore(ASSET_STORE_NAME).put({ id: assetId, blob });
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}

export async function deleteMapAsset(assetId: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(ASSET_STORE_NAME, "readwrite");
    transaction.objectStore(ASSET_STORE_NAME).delete(assetId);
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}

export async function migrateLegacyXaeroMap(): Promise<{
  blob: Blob;
  source: RasterMapSource;
} | null> {
  const database = await openDatabase();
  try {
    if (!database.objectStoreNames.contains(LEGACY_STORE_NAME)) return null;
    const transaction = database.transaction(LEGACY_STORE_NAME, "readonly");
    const request = transaction
      .objectStore(LEGACY_STORE_NAME)
      .get("active") as IDBRequest<LegacyXaeroRecord | undefined>;
    const legacy = await new Promise<LegacyXaeroRecord | undefined>(
      (resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );
    if (!legacy) return null;
    const assetId = crypto.randomUUID();
    await writeMapAsset(assetId, legacy.blob);
    const cleanup = database.transaction(LEGACY_STORE_NAME, "readwrite");
    cleanup.objectStore(LEGACY_STORE_NAME).delete("active");
    await waitForTransaction(cleanup);
    return {
      blob: legacy.blob,
      source: {
        kind: "raster",
        assetId,
        preset: "xaero",
        ...legacy.calibration,
      },
    };
  } finally {
    database.close();
  }
}
