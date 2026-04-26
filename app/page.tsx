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
  const { authReady, cloudEnabled, user, signingOut } = useClassenseCloud();

  const renderTabButton = (tabKey: string, label: string) => (
    <button
      key={tabKey}
      onClick={() => setActiveTab(tabKey)}
      style={activeTab === tabKey ? activeTabStyle : tab}
      onMouseEnter={(e) => applyHover(e.currentTarget, activeTab === tabKey)}
      onMouseLeave={(e) => resetHover(e.currentTarget, activeTab === tabKey)}
    >
      {label}
    </button>
  );

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
      {isMobile ? (
        <nav
          style={{
            background: "var(--nav-bg)",
            borderBottom: "1px solid var(--border-strong)",
            display: "grid",
            gap: 10,
            textAlign: "center",
            fontSize: 12,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            paddingTop: 10,
            paddingLeft: 10,
            paddingRight: 10,
            paddingBottom: 10,
            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
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
            fontSize: 13,
            position: "sticky",
            top: 0,
            padding: "8px 18px",
            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
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
            fontSize: 12,
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            paddingTop: 10,
            paddingLeft: 10,
            paddingRight: 10,
            paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
            boxShadow: "0 -6px 18px rgba(15, 23, 42, 0.08)",
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

const tab = {
  padding: "10px 8px",
  minHeight: "42px",
  background: "rgba(15, 23, 42, 0.08)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  cursor: "pointer",
  color: "var(--text)",
  fontWeight: 600,
  lineHeight: 1.2,
  borderRadius: "999px",
  transition: "all 0.18s ease",
};

const activeTabStyle = {
  ...tab,
  background: "linear-gradient(135deg, rgba(37, 99, 235, 0.22), rgba(96, 165, 250, 0.2))",
  border: "1px solid rgba(37, 99, 235, 0.28)",
  color: "#2563eb",
};

const applyHover = (element: HTMLButtonElement, isActive: boolean) => {
  element.style.transform = "translateY(-1px)";
  element.style.background = isActive
    ? "rgba(37, 99, 235, 0.18)"
    : "rgba(148, 163, 184, 0.16)";
};

const resetHover = (element: HTMLButtonElement, isActive: boolean) => {
  element.style.transform = "none";
  element.style.background = isActive
    ? "linear-gradient(135deg, rgba(37, 99, 235, 0.22), rgba(96, 165, 250, 0.2))"
    : "rgba(15, 23, 42, 0.08)";
};
