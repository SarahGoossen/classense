"use client";

import { useState } from "react";

import Home from "./components/Home";
import Planner from "./components/Planner";
import Logs from "./components/Logs";
import Library from "./components/Library";
import Settings from "./components/Settings";
import Classes from "./components/Classes";

export default function Page() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f5f5f5",
        color: "#000",
      }}
    >
      <div style={{ flex: 1, background: "#fff" }}>
        {activeTab === "home" && (
          <Home
            setTab={setActiveTab}
            setSelectedLogId={setSelectedLogId}
          />
        )}

        {activeTab === "classes" && <Classes />}
        {activeTab === "planner" && <Planner />}

        {activeTab === "logs" && (
          <Logs selectedLogId={selectedLogId} />
        )}

        {activeTab === "library" && <Library />}
        {activeTab === "settings" && <Settings />}
      </div>

      <nav
        style={{
          background: "#fff",
          borderTop: "1px solid #ddd",
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          textAlign: "center",
          fontSize: 14,
        }}
      >
        <button onClick={() => setActiveTab("home")} style={tab}>Home</button>
        <button onClick={() => setActiveTab("classes")} style={tab}>Classes</button>
        <button onClick={() => setActiveTab("planner")} style={tab}>Calendar</button>
        <button onClick={() => setActiveTab("logs")} style={tab}>Logs</button>
        <button onClick={() => setActiveTab("library")} style={tab}>Library</button>
        <button onClick={() => setActiveTab("settings")} style={tab}>Settings</button>
      </nav>
    </main>
  );
}

const tab = {
  padding: "12px 0",
  background: "transparent",
  border: "none",
  cursor: "pointer",
};