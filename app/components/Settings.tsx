"use client";

import { useEffect, useState } from "react";

type ClassItem = { name: string };

export default function Settings() {
  const [name, setName] = useState("");
  const [defaultClass, setDefaultClass] = useState("");
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [classReminder, setClassReminder] = useState(true);
  const [prepReminder, setPrepReminder] = useState(true);

  const [prepTime, setPrepTime] = useState("2h");

  useEffect(() => {
    const savedName = localStorage.getItem("app_name");
    const savedClass = localStorage.getItem("lastUsedClass");
    const savedClasses = JSON.parse(localStorage.getItem("classes") || "[]");

    const savedReminders = localStorage.getItem("remindersEnabled");
    const savedClassReminder = localStorage.getItem("classReminder");
    const savedPrep = localStorage.getItem("prepReminder");
    const savedPrepTime = localStorage.getItem("prepTime");

    if (savedName) setName(savedName);
    if (savedClass) setDefaultClass(savedClass);
    if (savedClasses) setClasses(savedClasses);

    if (savedReminders) setRemindersEnabled(savedReminders === "true");
    if (savedClassReminder) setClassReminder(savedClassReminder === "true");
    if (savedPrep) setPrepReminder(savedPrep === "true");

    if (savedPrepTime) setPrepTime(savedPrepTime);
  }, []);

  const handleSave = () => {
    localStorage.setItem("app_name", name);
    localStorage.setItem("lastUsedClass", defaultClass);

    localStorage.setItem("remindersEnabled", remindersEnabled.toString());
    localStorage.setItem("classReminder", classReminder.toString());
    localStorage.setItem("prepReminder", prepReminder.toString());
    localStorage.setItem("prepTime", prepTime);

    alert("Saved ✓");
  };

  const handleClear = () => {
    const confirmText = prompt("Type DELETE to confirm reset");
    if (confirmText !== "DELETE") return;

    localStorage.clear();
    location.reload();
  };

  return (
    <div style={container}>
      <h2 style={title}>Settings</h2>

      {/* PROFILE */}
      <div style={card}>
        <div style={sectionTitle}>Profile</div>
        <input
          placeholder="Your Name / Studio"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={input}
        />
      </div>

      {/* DEFAULT CLASS */}
      <div style={card}>
        <div style={sectionTitle}>Default Class</div>

        <select
          value={defaultClass}
          onChange={(e) => setDefaultClass(e.target.value)}
          style={input}
        >
          <option value="">Select Class</option>
          {classes.map((c, i) => (
            <option key={`${c.name}-${i}`} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <div style={helper}>
          Used as default when creating new lessons
        </div>
      </div>

      {/* REMINDERS */}
      <div style={card}>
        <div style={sectionTitle}>Reminders</div>

        <Toggle label="Enable Reminders" value={remindersEnabled} setValue={setRemindersEnabled} />
        <Toggle label="Class Reminder" value={classReminder} setValue={setClassReminder} />
        <Toggle label="Lesson Prep Reminder" value={prepReminder} setValue={setPrepReminder} />
      </div>

      {/* TIMING */}
      <div style={card}>
        <div style={sectionTitle}>Prep Reminder Timing</div>

        <select
          value={prepTime}
          onChange={(e) => setPrepTime(e.target.value)}
          style={input}
        >
          <option value="30m">30 min before</option>
          <option value="1h">1 hour before</option>
          <option value="2h">2 hours before</option>
          <option value="1d">1 day before</option>
          <option value="2d">2 days before</option>
          <option value="1w">1 week before</option>
        </select>
      </div>

      {/* NOTIFICATIONS */}
      <div style={card}>
        <div style={sectionTitle}>Notifications</div>

        <div style={helper}>
          Reminders use your device notifications
        </div>

        <button
          style={secondaryBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
          }}
          onClick={() =>
            alert("Go to your phone settings → Notifications → enable for this app")
          }
        >
          How to Enable Notifications
        </button>
      </div>

      {/* DATA */}
      <div style={card}>
        <div style={sectionTitle}>Data</div>

        <button
          onClick={handleClear}
          style={dangerBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
          }}
        >
          Reset All Data
        </button>
      </div>

      {/* SAVE */}
      <button
        onClick={handleSave}
        style={primaryBtn}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 10px 24px rgba(37,99,235,0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Save Settings
      </button>
    </div>
  );
}

/* TOGGLE */
function Toggle({ label, value, setValue }) {
  return (
    <div style={toggleRow}>
      <span>{label}</span>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={toggleLabel}>{value ? "ON" : "OFF"}</span>

        <button
          onClick={() => setValue(!value)}
          style={{
            ...toggleTrack,
            background: value ? "#2563eb" : "#d1d5db",
          }}
        >
          <div
            style={{
              ...toggleThumb,
              transform: value ? "translateX(24px)" : "translateX(0)",
            }}
          />
        </button>
      </div>
    </div>
  );
}

/* STYLES */

const container = {
  padding: 20,
  maxWidth: 520,
  margin: "0 auto",
};

const title = {
  fontSize: 22,
  fontWeight: 600,
  marginBottom: 14,
};

const card = {
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(255,255,255,0.6)",
  borderRadius: 14,
  padding: 16,
  marginBottom: 12,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: 600,
};

const input = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.08)",
  boxSizing: "border-box",
};

const helper = {
  fontSize: 12,
  color: "#6b7280",
};

const primaryBtn = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  background: "linear-gradient(135deg,#1e3a8a,#2563eb,#60a5fa)",
  color: "white",
  border: "none",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const secondaryBtn = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const dangerBtn = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  background: "#fee2e2",
  color: "#b91c1c",
  border: "1px solid #fecaca",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const toggleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const toggleLabel = {
  fontSize: 12,
  fontWeight: 600,
};

const toggleTrack = {
  width: 48,
  height: 24,
  borderRadius: 999,
  padding: 2,
  display: "flex",
  alignItems: "center",
  transition: "all 0.2s ease",
};

const toggleThumb = {
  width: 20,
  height: 20,
  background: "#fff",
  borderRadius: "50%",
  transition: "all 0.2s ease",
};