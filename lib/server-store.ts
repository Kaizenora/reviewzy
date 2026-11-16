import { GoogleReview } from "@/types/shop";

interface ServerStoreData {
  connections: Record<
    string,
    {
      googleConnected?: boolean;
      reportToken?: string;
      timezone?: string;
      googleLastSyncedAt?: string;
      googleLastError?: string | null;
      googleSyncStatus?: "idle" | "syncing" | "failed" | "success";
    }
  >;
  reviews: Record<string, GoogleReview[]>;
}

function getNodeModules() {
  if (typeof window !== "undefined") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const req = eval("require");
    const fs = req("fs");
    const path = req("path");
    const dataDir = path.join(process.cwd(), ".data");
    const storeFile = path.join(dataDir, "reports-data.json");
    return { fs, path, dataDir, storeFile };
  } catch {
    return null;
  }
}

function ensureStore(): ServerStoreData {
  const nm = getNodeModules();
  if (!nm) return { connections: {}, reviews: {} };
  try {
    if (!nm.fs.existsSync(nm.dataDir)) {
      nm.fs.mkdirSync(nm.dataDir, { recursive: true });
    }
    if (nm.fs.existsSync(nm.storeFile)) {
      const raw = nm.fs.readFileSync(nm.storeFile, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading server store:", err);
  }

  const initial: ServerStoreData = { connections: {}, reviews: {} };
  return initial;
}

function saveStore(data: ServerStoreData) {
  const nm = getNodeModules();
  if (!nm) return;
  try {
    if (!nm.fs.existsSync(nm.dataDir)) {
      nm.fs.mkdirSync(nm.dataDir, { recursive: true });
    }
    nm.fs.writeFileSync(nm.storeFile, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing server store:", err);
  }
}

export function getServerBusinessData(slug: string) {
  const store = ensureStore();
  return store.connections[slug.toLowerCase()] || null;
}

export function saveServerBusinessData(
  slug: string,
  updates: {
    googleConnected?: boolean;
    reportToken?: string;
    timezone?: string;
    googleLastSyncedAt?: string;
    googleLastError?: string | null;
    googleSyncStatus?: "idle" | "syncing" | "failed" | "success";
  }
) {
  const store = ensureStore();
  const key = slug.toLowerCase();
  store.connections[key] = {
    ...(store.connections[key] || {}),
    ...updates,
  };
  saveStore(store);
}

export function getServerGoogleReviews(slug: string): GoogleReview[] {
  const store = ensureStore();
  return store.reviews[slug.toLowerCase()] || [];
}

export function saveServerGoogleReviews(slug: string, reviews: GoogleReview[]) {
  const store = ensureStore();
  const key = slug.toLowerCase();
  const existing = store.reviews[key] || [];

  const map = new Map<string, GoogleReview>();
  existing.forEach((r) => map.set(r.googleReviewId, r));
  reviews.forEach((r) => map.set(r.googleReviewId, r));

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );

  store.reviews[key] = merged;
  saveStore(store);
}
