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

function AppShell() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { authReady, cloudEnabled, user } = useClassenseCloud();

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth <= 640);
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
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
      }}
    >
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

      <nav
        style={{
          background: "var(--nav-bg)",
          borderTop: "1px solid var(--border-strong)",
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)",
          textAlign: "center",
          fontSize: isMobile ? 12 : 13,
          position: "sticky",
          bottom: 0,
          paddingTop: isMobile ? 8 : 6,
          paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
          boxShadow: "0 -6px 18px rgba(15, 23, 42, 0.08)",
          zIndex: 20,
          transition: "background 0.25s ease, border-color 0.25s ease",
        }}
      >
        <button
          onClick={() => setActiveTab("home")}
          style={activeTab === "home" ? activeTabStyle : tab}
          onMouseEnter={(e) => applyHover(e.currentTarget, activeTab === "home")}
          onMouseLeave={(e) => resetHover(e.currentTarget, activeTab === "home")}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab("classes")}
          style={activeTab === "classes" ? activeTabStyle : tab}
          onMouseEnter={(e) => applyHover(e.currentTarget, activeTab === "classes")}
          onMouseLeave={(e) => resetHover(e.currentTarget, activeTab === "classes")}
        >
          Classes
        </button>
        <button
          onClick={() => setActiveTab("planner")}
          style={activeTab === "planner" ? activeTabStyle : tab}
          onMouseEnter={(e) => applyHover(e.currentTarget, activeTab === "planner")}
          onMouseLeave={(e) => resetHover(e.currentTarget, activeTab === "planner")}
        >
          Calendar
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          style={activeTab === "logs" ? activeTabStyle : tab}
          onMouseEnter={(e) => applyHover(e.currentTarget, activeTab === "logs")}
          onMouseLeave={(e) => resetHover(e.currentTarget, activeTab === "logs")}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab("library")}
          style={activeTab === "library" ? activeTabStyle : tab}
          onMouseEnter={(e) => applyHover(e.currentTarget, activeTab === "library")}
          onMouseLeave={(e) => resetHover(e.currentTarget, activeTab === "library")}
        >
          Library
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          style={activeTab === "settings" ? activeTabStyle : tab}
          onMouseEnter={(e) => applyHover(e.currentTarget, activeTab === "settings")}
          onMouseLeave={(e) => resetHover(e.currentTarget, activeTab === "settings")}
        >
          Settings
        </button>
      </nav>
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
  padding: "10px 4px",
  minHeight: "44px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--text)",
  fontWeight: 600,
  lineHeight: 1.2,
  borderRadius: "10px",
  transition: "all 0.18s ease",
};

const activeTabStyle = {
  ...tab,
  background: "rgba(37, 99, 235, 0.14)",
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
    ? "rgba(37, 99, 235, 0.14)"
    : "transparent";
};
