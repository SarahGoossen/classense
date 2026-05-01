"use client";

import { useEffect, useState } from "react";

import AuthGate from "./components/AuthGate";
import Home from "./components/Home";
import Planner from "./components/Planner";
import Logs from "./components/Logs";
import Library from "./components/Library";
import Settings from "./components/Settings";
import Classes from "./components/Classes";
import { ClassenseCloudProvider, useClassenseCloud } from "./context/ClassenseCloud";

const mobilePrimaryTabs = [
  { key: "home", label: "Home" },
  { key: "logs", label: "Logs" },
  { key: "library", label: "Library" },
] as const;

const mobileSecondaryTabs = [
  { key: "classes", label: "Classes" },
  { key: "planner", label: "Calendar" },
  { key: "settings", label: "Settings" },
] as const;

const desktopTabs = [
  { key: "home", label: "Home" },
  { key: "classes", label: "Classes" },
  { key: "planner", label: "Calendar" },
  { key: "logs", label: "Logs" },
  { key: "library", label: "Library" },
  { key: "settings", label: "Settings" },
] as const;

const MOBILE_TOP_NAV_HEIGHT = 72;
const MOBILE_BOTTOM_NAV_HEIGHT = 76;

const FIRED_REMINDER_STORAGE_KEY = "firedReminderIds";
const LIVE_VERSION_STORAGE_KEY = "classenseLiveVersion";

type ReminderRecord = {
  id: number;
  title: string;
  className?: string;
  lessonDate?: string;
  remindAt?: string;
  type?: string;
};

const getReminderBody = (reminder: ReminderRecord) => {
  const parts = [reminder.className, reminder.lessonDate].filter(Boolean);

  if (reminder.type === "draft") {
    return parts.length > 0
      ? `Time to finish this lesson draft: ${parts.join(" • ")}`
      : "Time to finish this lesson draft.";
  }

  return parts.length > 0
    ? `Reminder for ${parts.join(" • ")}`
    : "You have a Classense reminder.";
};

function AppShell() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [signOutQuote, setSignOutQuote] = useState("");
  const [latestLiveVersion, setLatestLiveVersion] = useState("");
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const { authReady, cloudEnabled, user, signingOut } = useClassenseCloud();

  const renderTabButton = (tabKey: string, label: string) => {
    const currentStyle = getTabStyle(tabKey, activeTab === tabKey, isDarkMode);

    return (
      <button
        key={tabKey}
        onClick={() => setActiveTab(tabKey)}
        style={currentStyle}
        onMouseEnter={(e) => applyHover(e.currentTarget)}
        onMouseLeave={(e) => resetHover(e.currentTarget)}
      >
        {label}
      </button>
    );
  };

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth <= 1100);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDarkMode(root.classList.contains("dark"));

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!signingOut) return;

    const quotes = [
      "Have a great day. Your teaching work is safely waiting for you.",
      "Signed out. Wishing you a calm and productive day ahead.",
      "You are signed out. Come back anytime and Classense will be ready.",
      "Have a great day. Your plans and notes will be here when you return.",
    ];

    const hour = new Date().getHours();
    setSignOutQuote(quotes[hour % quotes.length]);
  }, [signingOut]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const notifyDueReminders = () => {
      if (Notification.permission !== "granted") return;

      const reminders = JSON.parse(localStorage.getItem("reminders") || "[]") as ReminderRecord[];
      const now = Date.now();
      const firedIds = new Set<number>(
        JSON.parse(localStorage.getItem(FIRED_REMINDER_STORAGE_KEY) || "[]")
      );
      const currentReminderIds = new Set(reminders.map((reminder) => reminder.id));
      let changed = false;

      Array.from(firedIds).forEach((id) => {
        if (!currentReminderIds.has(id)) {
          firedIds.delete(id);
          changed = true;
        }
      });

      reminders.forEach((reminder) => {
        if (!reminder.remindAt || firedIds.has(reminder.id)) return;

        const dueAt = new Date(reminder.remindAt).getTime();
        if (Number.isNaN(dueAt) || dueAt > now) return;

        const notification = new Notification(reminder.title || "Classense reminder", {
          body: getReminderBody(reminder),
          tag: `classense-reminder-${reminder.id}`,
        });

        notification.onclick = () => {
          window.focus();
        };

        firedIds.add(reminder.id);
        changed = true;
      });

      if (changed) {
        localStorage.setItem(
          FIRED_REMINDER_STORAGE_KEY,
          JSON.stringify(Array.from(firedIds))
        );
      }
    };

    notifyDueReminders();
    const interval = window.setInterval(notifyDueReminders, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const checkForUpdate = async () => {
      try {
        const response = await fetch("/api/version", {
          cache: "no-store",
          headers: { "cache-control": "no-cache" },
        });

        if (!response.ok) return;
        const data = await response.json();
        const fetchedVersion = String(data.version || "").trim();
        if (!fetchedVersion || cancelled) return;

        const storedVersion = localStorage.getItem(LIVE_VERSION_STORAGE_KEY);
        setLatestLiveVersion(fetchedVersion);

        if (storedVersion && storedVersion !== fetchedVersion) {
          setUpdateAvailable(true);
          return;
        }

        localStorage.setItem(LIVE_VERSION_STORAGE_KEY, fetchedVersion);
      } catch {
        // If the version check fails, keep the current session running quietly.
      }
    };

    void checkForUpdate();

    const interval = window.setInterval(() => {
      void checkForUpdate();
    }, 60000);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void checkForUpdate();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const applyLiveUpdate = () => {
    if (latestLiveVersion) {
      localStorage.setItem(LIVE_VERSION_STORAGE_KEY, latestLiveVersion);
    }
    window.location.reload();
  };

  if (!authReady) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--bg)",
          color: "var(--text)",
          padding: 24,
        }}
      >
        Loading Classense...
      </main>
    );
  }

  if (signingOut) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 32%), linear-gradient(180deg, #f8fbff, #eef4ff)",
          color: "#0f172a",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "min(560px, 100%)",
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(148, 163, 184, 0.22)",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#2563eb",
              marginBottom: 14,
            }}
          >
            Classense
          </div>
          <h1 style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)", margin: "0 0 12px" }}>
            You are signed out.
          </h1>
          <p style={{ margin: 0, color: "#475569", fontSize: "1rem", lineHeight: 1.65 }}>
            {signOutQuote}
          </p>
        </div>
      </main>
    );
  }

  if (cloudEnabled && !user) {
    return <AuthGate />;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--text)",
        transition: "background 0.25s ease, color 0.25s ease",
        paddingTop: isMobile ? `calc(${MOBILE_TOP_NAV_HEIGHT}px + env(safe-area-inset-top))` : 0,
        paddingBottom: isMobile
          ? `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))`
          : 0,
      }}
    >
      {updateAvailable && (
        <div
          style={{
            position: "fixed",
            top: isMobile ? "calc(env(safe-area-inset-top) + 10px)" : 14,
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(92vw, 520px)",
            zIndex: 120,
            padding: "12px 14px",
            borderRadius: 18,
            background: isDarkMode
              ? "rgba(15, 23, 42, 0.96)"
              : "rgba(255, 255, 255, 0.97)",
            border: isDarkMode
              ? "1px solid rgba(96, 165, 250, 0.28)"
              : "1px solid rgba(59, 130, 246, 0.18)",
            boxShadow: isDarkMode
              ? "0 18px 40px rgba(2, 6, 23, 0.42)"
              : "0 18px 40px rgba(15, 23, 42, 0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 2,
              }}
            >
              A new Classense update is ready.
            </div>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.5,
                color: "var(--muted)",
              }}
            >
              Refresh now to load the latest version in this app.
            </div>
          </div>

          <button
            type="button"
            onClick={applyLiveUpdate}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "10px 14px",
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: "0 10px 22px rgba(37, 99, 235, 0.24)",
            }}
          >
            Refresh
          </button>
        </div>
      )}

      {isMobile ? (
        <nav
          style={{
            background: "var(--nav-bg)",
            borderBottom: "1px solid var(--border-strong)",
            display: "grid",
            gap: 10,
            textAlign: "center",
            fontSize: 14,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            paddingTop: 11,
            paddingLeft: 10,
            paddingRight: 10,
            paddingBottom: 11,
            boxShadow: "0 10px 22px rgba(15, 23, 42, 0.1)",
            zIndex: 20,
            transition: "background 0.25s ease, border-color 0.25s ease",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {mobilePrimaryTabs.map(({ key, label }) => renderTabButton(key, label))}
          </div>
        </nav>
      ) : (
        <nav
          style={{
            background: "var(--nav-bg)",
            borderBottom: "1px solid var(--border-strong)",
            display: "grid",
            textAlign: "center",
            fontSize: 15,
            position: "sticky",
            top: 0,
            padding: "10px 18px",
            boxShadow: "0 10px 22px rgba(15, 23, 42, 0.08)",
            zIndex: 20,
            transition: "background 0.25s ease, border-color 0.25s ease",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {desktopTabs.map(({ key, label }) => renderTabButton(key, label))}
          </div>
        </nav>
      )}

      {activeTab === "home" && (
        <div
          style={{
            padding: isMobile ? "6px 16px 0" : "8px 20px 0",
            background: "transparent",
          }}
        >
          <div
            style={{
              fontSize: isMobile ? 16 : 18,
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: "0.015em",
              fontFamily: '"Palatino Linotype", "Book Antiqua", Georgia, serif',
              fontStyle: "italic",
              marginLeft: isMobile ? 10 : 14,
              color: isDarkMode ? "#f8fafc" : "#163a86",
              background: isDarkMode
                ? "linear-gradient(180deg, #ffffff 0%, #f8fafc 24%, #cbd5e1 54%, #ffffff 82%, #e2e8f0 100%)"
                : undefined,
              WebkitBackgroundClip: isDarkMode ? "text" : undefined,
              WebkitTextFillColor: isDarkMode ? "transparent" : undefined,
              textShadow: isDarkMode
                ? [
                    "0 1px 0 rgba(255,255,255,0.42)",
                    "0 2px 2px rgba(15,23,42,0.28)",
                    "0 8px 14px rgba(226,232,240,0.12)",
                  ].join(", ")
                : [
                    "0 1px 0 rgba(255,255,255,0.26)",
                    "0 1px 1px rgba(96,165,250,0.2)",
                    "0 2px 3px rgba(22,58,134,0.14)",
                  ].join(", "),
            }}
          >
            Classense
          </div>
        </div>
      )}

      <div style={{ flex: 1, background: "var(--surface)" }}>
        {activeTab === "home" && (
          <Home
            setTab={setActiveTab}
            setSelectedLogId={setSelectedLogId}
          />
        )}

        {activeTab === "classes" && <Classes />}
        {activeTab === "planner" && <Planner setTab={setActiveTab} />}

        {activeTab === "logs" && (
          <Logs selectedLogId={selectedLogId} />
        )}

        {activeTab === "library" && <Library />}
        {activeTab === "settings" && <Settings />}
      </div>

      {isMobile ? (
        <nav
          style={{
            background: "var(--nav-bg)",
            borderTop: "1px solid var(--border-strong)",
            display: "grid",
            gap: 10,
            textAlign: "center",
            fontSize: 14,
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            paddingTop: 11,
            paddingLeft: 10,
            paddingRight: 10,
            paddingBottom: "calc(9px + env(safe-area-inset-bottom))",
            boxShadow: "0 -8px 20px rgba(15, 23, 42, 0.1)",
            zIndex: 20,
            transition: "background 0.25s ease, border-color 0.25s ease",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {mobileSecondaryTabs.map(({ key, label }) => renderTabButton(key, label))}
          </div>
        </nav>
      ) : null}
    </main>
  );
}

export default function Page() {
  return (
    <ClassenseCloudProvider>
      <AppShell />
    </ClassenseCloudProvider>
  );
}

const tabBase = {
  padding: "11px 8px",
  minHeight: "46px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "1.03rem",
  letterSpacing: "0.01em",
  lineHeight: 1.2,
  borderRadius: "999px",
  transition: "all 0.18s ease",
};

const lightTabTones: Record<string, { idle: string; idleBorder: string; active: string; activeBorder: string; text: string }> = {
  home: {
    idle: "linear-gradient(135deg, rgba(219,234,254,0.94), rgba(191,219,254,0.88))",
    idleBorder: "rgba(96,165,250,0.26)",
    active: "linear-gradient(135deg, rgba(59,130,246,0.26), rgba(147,197,253,0.92))",
    activeBorder: "rgba(59,130,246,0.34)",
    text: "#163a86",
  },
  logs: {
    idle: "linear-gradient(135deg, rgba(224,231,255,0.94), rgba(199,210,254,0.88))",
    idleBorder: "rgba(129,140,248,0.24)",
    active: "linear-gradient(135deg, rgba(99,102,241,0.24), rgba(196,181,253,0.9))",
    activeBorder: "rgba(99,102,241,0.34)",
    text: "#3730a3",
  },
  library: {
    idle: "linear-gradient(135deg, rgba(220,252,231,0.94), rgba(187,247,208,0.88))",
    idleBorder: "rgba(74,222,128,0.24)",
    active: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(187,247,208,0.92))",
    activeBorder: "rgba(34,197,94,0.32)",
    text: "#166534",
  },
  classes: {
    idle: "linear-gradient(135deg, rgba(219,234,254,0.94), rgba(191,219,254,0.88))",
    idleBorder: "rgba(96,165,250,0.26)",
    active: "linear-gradient(135deg, rgba(59,130,246,0.26), rgba(147,197,253,0.92))",
    activeBorder: "rgba(59,130,246,0.34)",
    text: "#163a86",
  },
  planner: {
    idle: "linear-gradient(135deg, rgba(224,231,255,0.94), rgba(199,210,254,0.88))",
    idleBorder: "rgba(129,140,248,0.24)",
    active: "linear-gradient(135deg, rgba(99,102,241,0.24), rgba(196,181,253,0.9))",
    activeBorder: "rgba(99,102,241,0.34)",
    text: "#3730a3",
  },
  settings: {
    idle: "linear-gradient(135deg, rgba(220,252,231,0.94), rgba(187,247,208,0.88))",
    idleBorder: "rgba(74,222,128,0.24)",
    active: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(187,247,208,0.92))",
    activeBorder: "rgba(34,197,94,0.32)",
    text: "#166534",
  },
};

const getTabStyle = (tabKey: string, isActive: boolean, isDarkMode: boolean) => {
  const tone = lightTabTones[tabKey] ?? lightTabTones.home;

  if (isDarkMode) {
    return {
      ...tabBase,
      background: isActive
        ? "linear-gradient(135deg, rgba(71,85,105,0.9), rgba(148,163,184,0.46), rgba(226,232,240,0.18))"
        : "linear-gradient(135deg, rgba(30,41,59,0.96), rgba(51,65,85,0.9))",
      border: isActive
        ? "1px solid rgba(226,232,240,0.34)"
        : "1px solid rgba(148,163,184,0.22)",
      color: isActive ? "#ffffff" : "#f1f5f9",
      boxShadow: isActive
        ? "inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 18px rgba(2,6,23,0.34)"
        : "inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 14px rgba(2,6,23,0.24)",
      textShadow: isActive
        ? "0 1px 0 rgba(255,255,255,0.34), 0 0 12px rgba(255,255,255,0.3)"
        : "0 1px 0 rgba(255,255,255,0.16), 0 0 10px rgba(226,232,240,0.18)",
    };
  }

  return {
    ...tabBase,
    background: isActive ? tone.active : tone.idle,
    border: `1px solid ${isActive ? tone.activeBorder : tone.idleBorder}`,
    color: tone.text,
    boxShadow: isActive
      ? "inset 0 1px 0 rgba(255,255,255,0.42), 0 8px 16px rgba(15,23,42,0.1)"
      : "inset 0 1px 0 rgba(255,255,255,0.36), 0 5px 12px rgba(15,23,42,0.07)",
    textShadow: "0 1px 0 rgba(255,255,255,0.3)",
  };
};

const applyHover = (element: HTMLButtonElement) => {
  element.style.transform = "translateY(-1px)";
  element.style.filter = "brightness(1.04)";
};

const resetHover = (element: HTMLButtonElement) => {
  element.style.transform = "none";
  element.style.filter = "none";
};
