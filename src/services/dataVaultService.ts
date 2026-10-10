import { UserProfile, DriverProfile, Ride, Rating, Complaint } from '../types';

const DB_NAME = 'motodrive_secure_vault_v1';
const DB_VERSION = 1;
const STORE_USERS = 'users_vault';
const STORE_DRIVERS = 'drivers_vault';
const STORE_RIDES = 'rides_vault';
const STORE_META = 'meta_vault';

const PRIMARY_DIR_KEY = 'motodrive_phone_directory';
const BACKUP_DIR_KEY = 'motodrive_phone_directory_backup_v2';
const PRIMARY_SESSION_KEY = 'motodrive_user_session';
const BACKUP_SESSION_KEY = 'motodrive_user_session_backup_v2';
const PRIMARY_RIDES_KEY = 'motodrive_saved_rides';
const BACKUP_RIDES_KEY = 'motodrive_saved_rides_backup_v2';

// Simple deterministic integrity signature (FNV-1a 32-bit hash) to verify data hasn't been corrupted
export function computeDataChecksum(payload: unknown): string {
  try {
    const str = JSON.stringify(payload);
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return 'mdz-' + hash.toString(16).padStart(8, '0');
  } catch {
    return 'mdz-00000000';
  }
}

// Open or initialize IndexedDB database
function openVaultDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_USERS)) {
          db.createObjectStore(STORE_USERS, { keyPath: 'phone' });
        }
        if (!db.objectStoreNames.contains(STORE_DRIVERS)) {
          db.createObjectStore(STORE_DRIVERS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_RIDES)) {
          db.createObjectStore(STORE_RIDES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// Request browser persistent storage so OS never evicts user accounts or trip history
export async function ensurePersistentBrowserStorage(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persisted();
      if (isPersisted) return true;
      return await navigator.storage.persist();
    }
  } catch {
    // Ignore errors
  }
  return false;
}

// Normalize Algerian phone number
export function normalizeVaultPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const digitsAndPlus = rawPhone.trim().replace(/[\s\-().]/g, '');
  if (digitsAndPlus.startsWith('+213')) {
    return '0' + digitsAndPlus.slice(4);
  }
  if (digitsAndPlus.startsWith('00213')) {
    return '0' + digitsAndPlus.slice(5);
  }
  if (digitsAndPlus.startsWith('213') && digitsAndPlus.length >= 11) {
    return '0' + digitsAndPlus.slice(3);
  }
  return digitsAndPlus;
}

export interface VaultDirectoryEntry {
  phone: string;
  profile: UserProfile;
  driver?: DriverProfile | null;
  checksum: string;
  updatedAt: number;
}

// Save a user & driver record to all redundant layers (LocalStorage Primary + Backup + IndexedDB)
export async function saveUserToSecureVault(
  phone: string,
  profile: UserProfile,
  driver?: DriverProfile | null
): Promise<void> {
  const cleanPhone = normalizeVaultPhone(phone || profile.phone);
  if (!cleanPhone || profile.id === 'passenger-guest') return;

  // Never store plaintext passwords in profile objects
  const sanitizedProfile: UserProfile = { ...profile, phone: cleanPhone };
  delete (sanitizedProfile as any).password;

  const entry: VaultDirectoryEntry = {
    phone: cleanPhone,
    profile: sanitizedProfile,
    driver: driver || null,
    checksum: computeDataChecksum({ profile: sanitizedProfile, driver: driver || null }),
    updatedAt: Date.now(),
  };

  // 1. Save to Primary & Backup LocalStorage Directory
  try {
    const dir = loadPhoneDirectoryFromStorage();
    const existing = dir[cleanPhone];
    dir[cleanPhone] = {
      profile: sanitizedProfile,
      driver: driver !== undefined ? driver : existing?.driver || null,
      checksum: entry.checksum,
      updatedAt: entry.updatedAt,
    };
    const serialized = JSON.stringify(dir);
    localStorage.setItem(PRIMARY_DIR_KEY, serialized);
    localStorage.setItem(BACKUP_DIR_KEY, serialized);
  } catch {
    // Ignore quota errors
  }

  // 2. Save to IndexedDB Vault
  try {
    const db = await openVaultDB();
    if (db) {
      const tx = db.transaction([STORE_USERS, STORE_DRIVERS], 'readwrite');
      tx.objectStore(STORE_USERS).put(entry);
      if (driver && driver.id) {
        tx.objectStore(STORE_DRIVERS).put({
          ...driver,
          phone: cleanPhone,
          updatedAtVault: Date.now(),
        });
      }
    }
  } catch {
    // Ignore IDB errors
  }
}

// Load phone directory with automatic self-healing between primary and backup keys
export function loadPhoneDirectoryFromStorage(): Record<
  string,
  { profile: UserProfile; driver?: DriverProfile | null; checksum?: string; updatedAt?: number }
> {
  let primaryDir: Record<string, any> = {};
  let backupDir: Record<string, any> = {};

  try {
    const rawPrimary = localStorage.getItem(PRIMARY_DIR_KEY);
    if (rawPrimary) primaryDir = JSON.parse(rawPrimary);
  } catch {
    primaryDir = {};
  }

  try {
    const rawBackup = localStorage.getItem(BACKUP_DIR_KEY);
    if (rawBackup) backupDir = JSON.parse(rawBackup);
  } catch {
    backupDir = {};
  }

  // Merge both so no account is ever lost if one key was cleared or corrupted
  const merged: Record<string, any> = { ...backupDir, ...primaryDir };
  for (const key of Object.keys(backupDir)) {
    const pEntry = primaryDir[key];
    const bEntry = backupDir[key];
    if (bEntry && (!pEntry || (bEntry.updatedAt || 0) > (pEntry.updatedAt || 0))) {
      merged[key] = bEntry;
    }
  }

  // Self-heal if one was missing entries
  try {
    if (Object.keys(merged).length > 0) {
      const serialized = JSON.stringify(merged);
      localStorage.setItem(PRIMARY_DIR_KEY, serialized);
      localStorage.setItem(BACKUP_DIR_KEY, serialized);
    }
  } catch {}

  return merged;
}

// Recover user & driver from IndexedDB Vault if LocalStorage was cleared
export async function getUserFromIndexedDBVault(
  phone: string
): Promise<{ profile: UserProfile | null; driver: DriverProfile | null }> {
  const cleanPhone = normalizeVaultPhone(phone);
  if (!cleanPhone) return { profile: null, driver: null };

  try {
    const db = await openVaultDB();
    if (!db) return { profile: null, driver: null };

    return await new Promise((resolve) => {
      const tx = db.transaction([STORE_USERS], 'readonly');
      const req = tx.objectStore(STORE_USERS).get(cleanPhone);
      req.onsuccess = () => {
        const res = req.result as VaultDirectoryEntry | undefined;
        if (res && res.profile) {
          // Also restore back into localStorage directory
          try {
            const dir = loadPhoneDirectoryFromStorage();
            dir[cleanPhone] = {
              profile: res.profile,
              driver: res.driver || null,
              checksum: res.checksum,
              updatedAt: res.updatedAt,
            };
            const serialized = JSON.stringify(dir);
            localStorage.setItem(PRIMARY_DIR_KEY, serialized);
            localStorage.setItem(BACKUP_DIR_KEY, serialized);
          } catch {}
          resolve({ profile: res.profile, driver: res.driver || null });
        } else {
          resolve({ profile: null, driver: null });
        }
      };
      req.onerror = () => resolve({ profile: null, driver: null });
    });
  } catch {
    return { profile: null, driver: null };
  }
}

// Hydrate all users & rides from IndexedDB into localStorage on boot (self-healing)
export async function hydrateVaultOnStartup(): Promise<{
  restoredUsersCount: number;
  restoredRidesCount: number;
}> {
  await ensurePersistentBrowserStorage();
  let restoredUsersCount = 0;
  let restoredRidesCount = 0;

  try {
    const db = await openVaultDB();
    if (!db) return { restoredUsersCount: 0, restoredRidesCount: 0 };

    // 1. Sync users from IDB -> LocalStorage
    const idbUsers: VaultDirectoryEntry[] = await new Promise((resolve) => {
      const tx = db.transaction([STORE_USERS], 'readonly');
      const req = tx.objectStore(STORE_USERS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    const dir = loadPhoneDirectoryFromStorage();
    let dirModified = false;

    for (const item of idbUsers) {
      if (item?.phone && item?.profile) {
        const existing = dir[item.phone];
        if (!existing || (item.updatedAt || 0) > (existing.updatedAt || 0)) {
          dir[item.phone] = {
            profile: item.profile,
            driver: item.driver || existing?.driver || null,
            checksum: item.checksum,
            updatedAt: item.updatedAt,
          };
          dirModified = true;
          restoredUsersCount++;
        }
      }
    }

    // Also push any localStorage users back into IDB
    for (const [phone, entry] of Object.entries(dir)) {
      if (entry?.profile) {
        saveUserToSecureVault(phone, entry.profile, entry.driver).catch(() => {});
      }
    }

    if (dirModified) {
      const serialized = JSON.stringify(dir);
      localStorage.setItem(PRIMARY_DIR_KEY, serialized);
      localStorage.setItem(BACKUP_DIR_KEY, serialized);
    }

    // 2. Sync Rides from IDB -> LocalStorage
    const idbRides: Ride[] = await new Promise((resolve) => {
      const tx = db.transaction([STORE_RIDES], 'readonly');
      const req = tx.objectStore(STORE_RIDES).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    const localRides = loadRidesFromSecureStorage();
    const ridesMap = new Map<string, Ride>();
    for (const r of idbRides) {
      if (r && r.id && !isPendingRideExpired(r)) {
        ridesMap.set(r.id, r);
      } else if (r && r.id && isPendingRideExpired(r)) {
        removeRideFromSecureVault(r.id).catch(() => {});
      }
    }
    for (const r of localRides) {
      if (r && r.id && !isPendingRideExpired(r)) {
        ridesMap.set(r.id, r);
      }
    }

    if (ridesMap.size > 0) {
      const mergedRides = Array.from(ridesMap.values()).sort(
        (a, b) => getRideRequestTimestampMs(b) - getRideRequestTimestampMs(a)
      );
      saveRidesToSecureVault(mergedRides);
      restoredRidesCount = mergedRides.length;
    }
  } catch {
    // Ignore errors
  }

  return { restoredUsersCount, restoredRidesCount };
}

// Save active session with redundant backup
export function saveActiveSessionSecurely(
  user: UserProfile,
  driver?: DriverProfile | null
): void {
  if (!user || user.id === 'passenger-guest') return;
  const cleanUser = { ...user };
  delete (cleanUser as any).password;

  const payload = {
    user: cleanUser,
    driver: driver || null,
    checksum: computeDataChecksum({ id: cleanUser.id, phone: cleanUser.phone }),
    timestamp: Date.now(),
  };

  try {
    const str = JSON.stringify(payload);
    localStorage.setItem(PRIMARY_SESSION_KEY, str);
    localStorage.setItem(BACKUP_SESSION_KEY, str);
  } catch {}

  if (cleanUser.phone) {
    saveUserToSecureVault(cleanUser.phone, cleanUser, driver).catch(() => {});
  }
}

// Load active session with automatic fallback to backup
export function loadActiveSessionSecurely(): {
  user: UserProfile | null;
  driver: DriverProfile | null;
} {
  try {
    const rawPrimary = localStorage.getItem(PRIMARY_SESSION_KEY) || localStorage.getItem(BACKUP_SESSION_KEY);
    if (rawPrimary) {
      const parsed = JSON.parse(rawPrimary);
      if (parsed?.user) {
        // Restore primary if it was missing
        if (!localStorage.getItem(PRIMARY_SESSION_KEY)) {
          localStorage.setItem(PRIMARY_SESSION_KEY, rawPrimary);
        }
        return {
          user: parsed.user,
          driver: parsed.driver || null,
        };
      }
    }
  } catch {}
  return { user: null, driver: null };
}

// Clear active session on explicit logout while preserving the permanent vault
export function clearActiveSessionOnly(): void {
  try {
    localStorage.removeItem(PRIMARY_SESSION_KEY);
    localStorage.removeItem(BACKUP_SESSION_KEY);
    localStorage.removeItem('motodrive_user_role');
    localStorage.removeItem('motodrive_current_role');
    localStorage.removeItem('motodrive_current_user');
  } catch {}
}

export const PENDING_RIDE_EXPIRY_MS = 8 * 60 * 1000; // 08 minutes max for unaccepted ride requests

export function getRideRequestTimestampMs(ride: Partial<Ride> | null | undefined): number {
  if (!ride) return 0;
  const raw = ride.requestedAt || (ride as any).createdAt;
  if (!raw) return 0;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const parsed = new Date(raw).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof raw === 'object') {
    if (typeof (raw as any).toMillis === 'function') return (raw as any).toMillis();
    if (typeof (raw as any).seconds === 'number') return (raw as any).seconds * 1000;
  }
  return 0;
}

export function isPendingRideExpired(ride: Partial<Ride> | null | undefined): boolean {
  if (!ride) return true;
  const isPendingStatus =
    ride.status === 'searching' ||
    ride.status === 'offers_available' ||
    (ride.status as string) === 'pending';
  if (!isPendingStatus) return false;

  const requestedTimeMs = getRideRequestTimestampMs(ride);
  if (!requestedTimeMs) return true;
  return Date.now() - requestedTimeMs >= PENDING_RIDE_EXPIRY_MS;
}

export async function removeRideFromSecureVault(rideId: string): Promise<void> {
  if (!rideId) return;
  try {
    [PRIMARY_RIDES_KEY, BACKUP_RIDES_KEY].forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((r: any) => r && r.id !== rideId && !isPendingRideExpired(r));
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    });
  } catch {}

  try {
    const db = await openVaultDB();
    if (db) {
      const tx = db.transaction([STORE_RIDES], 'readwrite');
      tx.objectStore(STORE_RIDES).delete(rideId);
    }
  } catch {}
}

// Save rides list to primary, backup, and IndexedDB (filtering out expired pending rides)
export function saveRidesToSecureVault(rides: Ride[]): void {
  if (!Array.isArray(rides)) return;
  try {
    const activeIds = new Set(rides.map((r) => r?.id).filter(Boolean));
    const existing = loadRidesFromSecureStorage();
    const mergedMap = new Map<string, Ride>();

    // Only keep historical completed/cancelled rides from existing storage; never resurrect removed or expired pending rides
    for (const r of existing) {
      if (!r || !r.id || isPendingRideExpired(r)) continue;
      const isPending = r.status === 'searching' || r.status === 'offers_available';
      if (!isPending || activeIds.has(r.id)) {
        mergedMap.set(r.id, r);
      }
    }

    for (const r of rides) {
      if (r && r.id && !isPendingRideExpired(r)) {
        mergedMap.set(r.id, r);
      }
    }

    const finalRides = Array.from(mergedMap.values()).sort(
      (a, b) => getRideRequestTimestampMs(b) - getRideRequestTimestampMs(a)
    );

    const str = JSON.stringify(finalRides);
    localStorage.setItem(PRIMARY_RIDES_KEY, str);
    localStorage.setItem(BACKUP_RIDES_KEY, str);

    openVaultDB().then((db) => {
      if (!db) return;
      const tx = db.transaction([STORE_RIDES], 'readwrite');
      const store = tx.objectStore(STORE_RIDES);
      store.clear();
      for (const r of finalRides.slice(0, 200)) {
        store.put(r);
      }
    }).catch(() => {});
  } catch {}
}

export function loadRidesFromSecureStorage(): Ride[] {
  try {
    const raw = localStorage.getItem(PRIMARY_RIDES_KEY) || localStorage.getItem(BACKUP_RIDES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((r: Ride) => r && r.id && !isPendingRideExpired(r));
      }
    }
  } catch {}
  return [];
}

export function saveRatingsToSecureVault(ratings: Rating[]): void {
  if (!Array.isArray(ratings)) return;
  try {
    const str = JSON.stringify(ratings);
    localStorage.setItem('motodrive_saved_ratings', str);
    localStorage.setItem('motodrive_saved_ratings_backup_v2', str);
  } catch {}
}

export function loadRatingsFromSecureStorage(): Rating[] {
  try {
    const raw =
      localStorage.getItem('motodrive_saved_ratings') ||
      localStorage.getItem('motodrive_saved_ratings_backup_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveComplaintsToSecureVault(complaints: Complaint[]): void {
  if (!Array.isArray(complaints)) return;
  try {
    const str = JSON.stringify(complaints);
    localStorage.setItem('motodrive_saved_complaints', str);
    localStorage.setItem('motodrive_saved_complaints_backup_v2', str);
  } catch {}
}

export function loadComplaintsFromSecureStorage(): Complaint[] {
  try {
    const raw =
      localStorage.getItem('motodrive_saved_complaints') ||
      localStorage.getItem('motodrive_saved_complaints_backup_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}
