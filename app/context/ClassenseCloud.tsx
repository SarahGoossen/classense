"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../lib/supabase";
import { emitClassenseStorageSync } from "../utils/storageSync";

type AuthMode = "signin" | "signup";

type Snapshot = {
  app_name: string;
  lastUsedClass: string;
  remindersEnabled: string;
  classReminder: string;
  prepReminder: string;
  prepTime: string;
  app_theme: string;
  classes: unknown[];
  logs: unknown[];
  plannerEvents: unknown[];
  library: unknown[];
  reminders: unknown[];
};

type CloudContextValue = {
  cloudEnabled: boolean;
  authReady: boolean;
  user: User | null;
  signingOut: boolean;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  syncStatus: string;
  signIn: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  persistSnapshotNow: () => Promise<{ ok: boolean; error?: string }>;
};

const STORAGE_KEYS = [
  "app_name",
  "lastUsedClass",
  "remindersEnabled",
  "classReminder",
  "prepReminder",
  "prepTime",
  "app_theme",
  "classes",
  "logs",
  "plannerEvents",
  "library",
  "reminders",
  "openLogId",
  "editLogId",
] as const;

const SNAPSHOT_KEYS = [
  "app_name",
  "lastUsedClass",
  "remindersEnabled",
  "classReminder",
  "prepReminder",
  "prepTime",
  "app_theme",
  "classes",
  "logs",
  "plannerEvents",
  "library",
  "reminders",
] as const;

const LOCAL_LOG_BACKUP_KEY = "classense_logs_local_backup";
const LOCAL_DIRTY_KEY = "classense_pending_cloud_sync";
const LAST_CLOUD_SYNC_KEY = "classense_last_cloud_sync_at";

const emptySnapshot = (): Snapshot => ({
  app_name: "",
  lastUsedClass: "",
  remindersEnabled: "true",
  classReminder: "true",
  prepReminder: "true",
  prepTime: "2h",
  app_theme: "light",
  classes: [],
  logs: [],
  plannerEvents: [],
  library: [],
  reminders: [],
});

const markLocalDirty = () => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_DIRTY_KEY, "true");
};

const clearLocalDirty = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_DIRTY_KEY);
};

const hasPendingLocalSync = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOCAL_DIRTY_KEY) === "true";
};

const readLastCloudSyncAt = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_CLOUD_SYNC_KEY);
};

const writeLastCloudSyncAt = (value: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_CLOUD_SYNC_KEY, value);
};

const clearStoredAuthSession = () => {
  if (typeof window === "undefined") return;

  const clearMatchingKeys = (storage: Storage) => {
    const keysToRemove: string[] = [];

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) continue;
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => storage.removeItem(key));
  };

  clearMatchingKeys(window.localStorage);
  clearMatchingKeys(window.sessionStorage);
};

const parseJson = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const readLocalSnapshot = (): Snapshot => {
  if (typeof window === "undefined") return emptySnapshot();

  return {
    app_name: localStorage.getItem("app_name") || "",
    lastUsedClass: localStorage.getItem("lastUsedClass") || "",
    remindersEnabled: localStorage.getItem("remindersEnabled") ?? "true",
    classReminder: localStorage.getItem("classReminder") ?? "true",
    prepReminder: localStorage.getItem("prepReminder") ?? "true",
    prepTime: localStorage.getItem("prepTime") || "2h",
    app_theme: localStorage.getItem("app_theme") || "light",
    classes: parseJson(localStorage.getItem("classes"), []),
    logs: parseJson(localStorage.getItem("logs"), []),
    plannerEvents: parseJson(localStorage.getItem("plannerEvents"), []),
    library: parseJson(localStorage.getItem("library"), []),
    reminders: parseJson(localStorage.getItem("reminders"), []),
  };
};

const writeLocalSnapshot = (snapshot: Snapshot) => {
  if (typeof window === "undefined") return;

  localStorage.setItem("app_name", snapshot.app_name || "");
  localStorage.setItem("lastUsedClass", snapshot.lastUsedClass || "");
  localStorage.setItem("remindersEnabled", snapshot.remindersEnabled || "true");
  localStorage.setItem("classReminder", snapshot.classReminder || "true");
  localStorage.setItem("prepReminder", snapshot.prepReminder || "true");
  localStorage.setItem("prepTime", snapshot.prepTime || "2h");
  localStorage.setItem("app_theme", snapshot.app_theme || "light");
  localStorage.setItem("classes", JSON.stringify(snapshot.classes || []));
  localStorage.setItem("logs", JSON.stringify(snapshot.logs || []));
  localStorage.setItem(
    "plannerEvents",
    JSON.stringify(snapshot.plannerEvents || [])
  );
  localStorage.setItem("library", JSON.stringify(snapshot.library || []));
  localStorage.setItem("reminders", JSON.stringify(snapshot.reminders || []));
  emitClassenseStorageSync();
};

const hasMeaningfulData = (snapshot: Snapshot) =>
  snapshot.classes.length > 0 ||
  snapshot.logs.length > 0 ||
  snapshot.plannerEvents.length > 0 ||
  snapshot.library.length > 0 ||
  snapshot.reminders.length > 0 ||
  Boolean(snapshot.app_name);

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const toItemTimestamp = (item: Record<string, unknown>) => {
  const value =
    item.updatedAt ||
    item.updated_at ||
    item.modifiedAt ||
    item.modified_at ||
    item.createdAt ||
    item.created_at;

  if (typeof value !== "string") return null;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const toItemKey = (item: Record<string, unknown>) =>
  String(item.id ?? JSON.stringify(item));

const mergeById = <T extends Record<string, unknown>>(localItems: T[], remoteItems: T[]) => {
  const merged = new Map<string, T>();

  remoteItems.forEach((item) => {
    const key = toItemKey(item);
    merged.set(key, item);
  });

  localItems.forEach((item) => {
    const key = toItemKey(item);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, item);
      return;
    }

    const localTimestamp = toItemTimestamp(item);
    const remoteTimestamp = toItemTimestamp(existing);

    if (localTimestamp !== null && remoteTimestamp !== null) {
      if (localTimestamp >= remoteTimestamp) {
        merged.set(key, item);
      }
      return;
    }

    if (localTimestamp !== null && remoteTimestamp === null) {
      merged.set(key, item);
    }
  });

  return Array.from(merged.values());
};

const backupLocalOnlyLogs = (
  localLogs: Record<string, unknown>[],
  remoteLogs: Record<string, unknown>[]
) => {
  if (typeof window === "undefined") return;

  const remoteById = new Map<string, Record<string, unknown>>();
  remoteLogs.forEach((item) => {
    remoteById.set(toItemKey(item), item);
  });

  const extras = localLogs.filter((localLog) => {
    const key = toItemKey(localLog);
    const remoteLog = remoteById.get(key);
    if (!remoteLog) return true;

    const localTimestamp = toItemTimestamp(localLog);
    const remoteTimestamp = toItemTimestamp(remoteLog);
    return localTimestamp !== null && remoteTimestamp !== null && localTimestamp > remoteTimestamp;
  });

  if (extras.length === 0) return;

  const existingBackup = parseJson<Record<string, unknown>[]>(
    localStorage.getItem(LOCAL_LOG_BACKUP_KEY),
    []
  );
  const mergedBackup = mergeById(existingBackup, extras);
  localStorage.setItem(LOCAL_LOG_BACKUP_KEY, JSON.stringify(mergedBackup));
};

const mergeSnapshots = (localSnapshot: Snapshot, remoteSnapshot: Snapshot): Snapshot => {
  const remoteLogs = remoteSnapshot.logs as Record<string, unknown>[];
  const localLogs = localSnapshot.logs as Record<string, unknown>[];
  const shouldUseRemoteLogs = remoteLogs.length > 0;

  if (shouldUseRemoteLogs) {
    backupLocalOnlyLogs(localLogs, remoteLogs);
  }

  return {
    app_name: localSnapshot.app_name || remoteSnapshot.app_name || "",
    lastUsedClass: localSnapshot.lastUsedClass || remoteSnapshot.lastUsedClass || "",
    remindersEnabled: localSnapshot.remindersEnabled || remoteSnapshot.remindersEnabled || "true",
    classReminder: localSnapshot.classReminder || remoteSnapshot.classReminder || "true",
    prepReminder: localSnapshot.prepReminder || remoteSnapshot.prepReminder || "true",
    prepTime: localSnapshot.prepTime || remoteSnapshot.prepTime || "2h",
    app_theme: localSnapshot.app_theme || remoteSnapshot.app_theme || "light",
    classes: mergeById(localSnapshot.classes as Record<string, unknown>[], remoteSnapshot.classes as Record<string, unknown>[]),
    logs: shouldUseRemoteLogs ? remoteSnapshot.logs : localSnapshot.logs,
    plannerEvents: remoteSnapshot.plannerEvents,
    library: mergeById(localSnapshot.library as Record<string, unknown>[], remoteSnapshot.library as Record<string, unknown>[]),
    reminders: remoteSnapshot.reminders,
  };
};

const CloudContext = createContext<CloudContextValue | null>(null);

export function ClassenseCloudProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured());
  const [signingOut, setSigningOut] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [syncStatus, setSyncStatus] = useState(
    isSupabaseConfigured()
      ? "Sign in to keep your Classense data across devices."
      : "Cloud auth is not configured yet."
  );

  const cloudEnabled = isSupabaseConfigured();
  const applyingRemoteRef = useRef(false);
  const uploadTimerRef = useRef<number | null>(null);
  const signingOutRef = useRef(false);
  const localDirtyRef = useRef(hasPendingLocalSync());

  const pullRemoteSnapshot = useCallback(
    async (userId: string): Promise<Snapshot | null> => {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from("user_snapshots")
        .select("payload")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data?.payload) {
        return null;
      }

      return {
        ...emptySnapshot(),
        ...(data.payload as Partial<Snapshot>),
      };
    },
    [supabase]
  );

  const pushRemoteSnapshot = useCallback(
    async (userId: string, snapshot: Snapshot) => {
      if (!supabase) return;

      const { error } = await supabase.from("user_snapshots").upsert({
        user_id: userId,
        payload: snapshot,
        updated_at: new Date().toISOString(),
      });

      return error ? { error: error.message } : {};
    },
    [supabase]
  );

  const pushRemoteSnapshotWithRetry = useCallback(
    async (userId: string, snapshot: Snapshot) => {
      let lastError = "";

      for (const delay of [0, 1200, 3000]) {
        if (delay > 0) {
          await wait(delay);
        }

        const result = await pushRemoteSnapshot(userId, snapshot);
        if (!result?.error) {
          return {};
        }

        lastError = result.error;
      }

      return lastError ? { error: lastError } : { error: "unknown-error" };
    },
    [pushRemoteSnapshot]
  );

  const persistSnapshotNow = useCallback(async () => {
    if (!user || !cloudEnabled) {
      return { ok: true };
    }

    if (uploadTimerRef.current) {
      window.clearTimeout(uploadTimerRef.current);
      uploadTimerRef.current = null;
    }

    setSyncStatus("Saving to Classense Cloud...");
    let result: { error?: string } | undefined;

    try {
      result = await pushRemoteSnapshotWithRetry(user.id, readLocalSnapshot());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not reach Classense Cloud.";
      setSyncStatus("Cloud sync failed. Your latest changes are still on this device.");
      return { ok: false, error: message };
    }

    if (result?.error) {
      setSyncStatus("Cloud sync failed. Your latest changes are still on this device.");
      return { ok: false, error: result.error };
    }

    localDirtyRef.current = false;
    clearLocalDirty();
    const syncedAt = new Date().toISOString();
    writeLastCloudSyncAt(syncedAt);
    setSyncStatus("Classense Cloud is active.");
    return { ok: true };
  }, [cloudEnabled, pushRemoteSnapshotWithRetry, user]);

  const scheduleUpload = useCallback(() => {
    if (!user || !cloudEnabled || applyingRemoteRef.current) return;

    if (uploadTimerRef.current) {
      window.clearTimeout(uploadTimerRef.current);
    }

    uploadTimerRef.current = window.setTimeout(async () => {
      setSyncStatus("Saving to Classense Cloud...");
      let result: { error?: string } | undefined;

      try {
        result = await pushRemoteSnapshotWithRetry(user.id, readLocalSnapshot());
      } catch {
        setSyncStatus("Cloud sync failed. Your latest changes are still on this device.");
        return;
      }

      if (result?.error) {
        setSyncStatus("Cloud sync failed. Your latest changes are still on this device.");
        return;
      }
      localDirtyRef.current = false;
      clearLocalDirty();
      const syncedAt = new Date().toISOString();
      writeLastCloudSyncAt(syncedAt);
      setSyncStatus("Classense Cloud is active.");
    }, 500);
  }, [cloudEnabled, pushRemoteSnapshotWithRetry, user]);

  const hydrateUser = useCallback(
    async (nextUser: User | null) => {
      if (!cloudEnabled || !nextUser || !supabase) {
        setSyncStatus(
          cloudEnabled
            ? "Sign in to keep your Classense data across devices."
            : "Cloud auth is not configured yet."
        );
        return;
      }

      try {
        setSyncStatus("Syncing your Classense data...");

        const localSnapshot = readLocalSnapshot();
        localDirtyRef.current = hasPendingLocalSync() || localDirtyRef.current;

        if (localDirtyRef.current && hasMeaningfulData(localSnapshot)) {
          const result = await pushRemoteSnapshotWithRetry(nextUser.id, localSnapshot);
          if (result?.error) {
            setSyncStatus("Cloud sync failed. Your latest changes are still on this device.");
            return;
          }

          localDirtyRef.current = false;
          clearLocalDirty();
          const syncedAt = new Date().toISOString();
          writeLastCloudSyncAt(syncedAt);
          setSyncStatus("Classense Cloud is active.");
          return;
        }

        const remoteSnapshot = await Promise.race([
          pullRemoteSnapshot(nextUser.id),
          new Promise<Snapshot | null>((resolve) => {
            window.setTimeout(() => resolve(null), 8000);
          }),
        ]);
        const merged = remoteSnapshot
          ? mergeSnapshots(localSnapshot, remoteSnapshot)
          : localSnapshot;

        applyingRemoteRef.current = true;
        writeLocalSnapshot(merged);
        window.setTimeout(() => {
          applyingRemoteRef.current = false;
        }, 0);

        if (!remoteSnapshot || hasMeaningfulData(merged)) {
          const result = await pushRemoteSnapshotWithRetry(nextUser.id, merged);
          if (result?.error) {
            setSyncStatus("Cloud sync failed. Your latest changes are still on this device.");
            return;
          }
        }

        localDirtyRef.current = false;
        clearLocalDirty();
        const syncedAt = new Date().toISOString();
        writeLastCloudSyncAt(syncedAt);
        setSyncStatus("Classense Cloud is active.");
      } catch {
        applyingRemoteRef.current = false;
        setSyncStatus("Cloud sync failed. Your latest changes are still on this device.");
      }
    },
    [cloudEnabled, pullRemoteSnapshot, pushRemoteSnapshotWithRetry, supabase]
  );

  useEffect(() => {
    if (!cloudEnabled || !supabase) {
      return;
    }

    let active = true;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (signingOutRef.current && data.user) return;
      setUser(data.user ?? null);
      setSigningOut(false);
      setAuthReady(true);
      await hydrateUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (signingOutRef.current && session?.user) {
        return;
      }

      if (!session?.user) {
        signingOutRef.current = false;
      }

      setUser(session?.user ?? null);
      setSigningOut(false);
      setAuthReady(true);
      await hydrateUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [cloudEnabled, hydrateUser, supabase]);

  useEffect(() => {
    if (!cloudEnabled || !user) return;

    const refreshFromCloud = () => {
      void hydrateUser(user);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshFromCloud();
      }
    };

    window.addEventListener("focus", refreshFromCloud);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("focus", refreshFromCloud);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [cloudEnabled, hydrateUser, user]);

  useEffect(() => {
    if (!cloudEnabled || !user) return;

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.setItem = function patchedSetItem(key, value) {
      originalSetItem.call(this, key, value);
      if (this === window.localStorage && STORAGE_KEYS.includes(key as (typeof STORAGE_KEYS)[number])) {
        if (!applyingRemoteRef.current) {
          localDirtyRef.current = true;
          markLocalDirty();
        }
        emitClassenseStorageSync();
        scheduleUpload();
      }
    };

    Storage.prototype.removeItem = function patchedRemoveItem(key) {
      originalRemoveItem.call(this, key);
      if (this === window.localStorage && STORAGE_KEYS.includes(key as (typeof STORAGE_KEYS)[number])) {
        if (!applyingRemoteRef.current) {
          localDirtyRef.current = true;
          markLocalDirty();
        }
        emitClassenseStorageSync();
        scheduleUpload();
      }
    };

    return () => {
      Storage.prototype.setItem = originalSetItem;
      Storage.prototype.removeItem = originalRemoveItem;
    };
  }, [cloudEnabled, scheduleUpload, user]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: "Supabase is not configured yet." };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: "Supabase is not configured yet." };
    }

    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/confirm`
        : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });
    if (error) {
      return { error: error.message };
    }

    return data.user
      ? { message: "Account created. Check your email if confirmation is enabled." }
      : { message: "Check your email for the confirmation link." };
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: "Supabase is not configured yet." };
    }

    if (!email.trim()) {
      return { error: "Enter your email first so we know where to send the reset link." };
    }

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/confirm`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    return error
      ? { error: error.message }
      : { message: "If this email is registered, a password reset link is on the way." };
  };

  const signOut = async () => {
    if (!supabase) return;
    signingOutRef.current = true;
    setSigningOut(true);
    setUser(null);
    setAuthReady(true);
    setSyncStatus("Signing you out...");

    if (uploadTimerRef.current) {
      window.clearTimeout(uploadTimerRef.current);
      uploadTimerRef.current = null;
    }

    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => {
          window.setTimeout(resolve, 3000);
        }),
      ]);
    } finally {
      clearStoredAuthSession();
      signingOutRef.current = false;
      setSigningOut(false);
      setUser(null);
      setSyncStatus("Sign in to keep your Classense data across devices.");
      if (typeof window !== "undefined") {
        window.location.replace(window.location.pathname);
      }
    }
  };

  return (
    <CloudContext.Provider
      value={{
        cloudEnabled,
        authReady,
        user,
        signingOut,
        authMode,
        setAuthMode,
        syncStatus,
        signIn,
        signUp,
        resetPassword,
        signOut,
        persistSnapshotNow,
      }}
    >
      {children}
    </CloudContext.Provider>
  );
}

export const useClassenseCloud = () => {
  const context = useContext(CloudContext);

  if (!context) {
    throw new Error("useClassenseCloud must be used within ClassenseCloudProvider");
  }

  return context;
};
