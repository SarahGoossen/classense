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
  signOut: () => Promise<void>;
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
};

const hasMeaningfulData = (snapshot: Snapshot) =>
  snapshot.classes.length > 0 ||
  snapshot.logs.length > 0 ||
  snapshot.plannerEvents.length > 0 ||
  snapshot.library.length > 0 ||
  snapshot.reminders.length > 0 ||
  Boolean(snapshot.app_name);

const mergeById = <T extends Record<string, unknown>>(localItems: T[], remoteItems: T[]) => {
  const merged = new Map<string, T>();

  remoteItems.forEach((item) => {
    const key = String(item.id ?? JSON.stringify(item));
    merged.set(key, item);
  });

  localItems.forEach((item) => {
    const key = String(item.id ?? JSON.stringify(item));
    if (!merged.has(key)) {
      merged.set(key, item);
    }
  });

  return Array.from(merged.values());
};

const mergeSnapshots = (localSnapshot: Snapshot, remoteSnapshot: Snapshot): Snapshot => ({
  app_name: localSnapshot.app_name || remoteSnapshot.app_name || "",
  lastUsedClass: localSnapshot.lastUsedClass || remoteSnapshot.lastUsedClass || "",
  remindersEnabled: localSnapshot.remindersEnabled || remoteSnapshot.remindersEnabled || "true",
  classReminder: localSnapshot.classReminder || remoteSnapshot.classReminder || "true",
  prepReminder: localSnapshot.prepReminder || remoteSnapshot.prepReminder || "true",
  prepTime: localSnapshot.prepTime || remoteSnapshot.prepTime || "2h",
  app_theme: localSnapshot.app_theme || remoteSnapshot.app_theme || "light",
  classes: mergeById(localSnapshot.classes as Record<string, unknown>[], remoteSnapshot.classes as Record<string, unknown>[]),
  logs: mergeById(localSnapshot.logs as Record<string, unknown>[], remoteSnapshot.logs as Record<string, unknown>[]),
  plannerEvents: mergeById(
    localSnapshot.plannerEvents as Record<string, unknown>[],
    remoteSnapshot.plannerEvents as Record<string, unknown>[]
  ),
  library: mergeById(localSnapshot.library as Record<string, unknown>[], remoteSnapshot.library as Record<string, unknown>[]),
  reminders: mergeById(localSnapshot.reminders as Record<string, unknown>[], remoteSnapshot.reminders as Record<string, unknown>[]),
});

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

      await supabase.from("user_snapshots").upsert({
        user_id: userId,
        payload: snapshot,
        updated_at: new Date().toISOString(),
      });
    },
    [supabase]
  );

  const scheduleUpload = useCallback(() => {
    if (!user || !cloudEnabled || applyingRemoteRef.current) return;

    if (uploadTimerRef.current) {
      window.clearTimeout(uploadTimerRef.current);
    }

    uploadTimerRef.current = window.setTimeout(async () => {
      setSyncStatus("Saving to Classense Cloud...");
      await pushRemoteSnapshot(user.id, readLocalSnapshot());
      setSyncStatus("Classense Cloud is active.");
    }, 500);
  }, [cloudEnabled, pushRemoteSnapshot, user]);

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

      setSyncStatus("Syncing your Classense data...");

      const localSnapshot = readLocalSnapshot();
      const remoteSnapshot = await pullRemoteSnapshot(nextUser.id);
      const merged = remoteSnapshot
        ? mergeSnapshots(localSnapshot, remoteSnapshot)
        : localSnapshot;

      applyingRemoteRef.current = true;
      writeLocalSnapshot(merged);
      window.setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 0);

      if (!remoteSnapshot || hasMeaningfulData(merged)) {
        await pushRemoteSnapshot(nextUser.id, merged);
      }

      setSyncStatus("Classense Cloud is active.");
    },
    [cloudEnabled, pullRemoteSnapshot, pushRemoteSnapshot, supabase]
  );

  useEffect(() => {
    if (!cloudEnabled || !supabase) {
      return;
    }

    let active = true;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setSigningOut(false);
      setAuthReady(true);
      await hydrateUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.setItem = function patchedSetItem(key, value) {
      originalSetItem.call(this, key, value);
      if (this === window.localStorage && STORAGE_KEYS.includes(key as (typeof STORAGE_KEYS)[number])) {
        scheduleUpload();
      }
    };

    Storage.prototype.removeItem = function patchedRemoveItem(key) {
      originalRemoveItem.call(this, key);
      if (this === window.localStorage && STORAGE_KEYS.includes(key as (typeof STORAGE_KEYS)[number])) {
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
      typeof window !== "undefined" ? window.location.origin : undefined;

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

  const signOut = async () => {
    if (!supabase) return;
    setSigningOut(true);
    setAuthReady(true);
    setUser(null);
    setSyncStatus("Signing you out...");

    await supabase.auth.signOut();
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
        signOut,
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
