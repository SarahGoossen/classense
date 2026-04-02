"use client";

import { useEffect, useRef, useState } from "react";
import { useClassenseCloud } from "../context/ClassenseCloud";
import {
  AUTO_DARK_START_HOUR,
  AUTO_LIGHT_START_HOUR,
  applyTheme,
  getStoredTheme,
  saveTheme,
  type ThemeMode,
} from "../utils/theme";

type ClassItem = { name: string };
const CLASSENSE_STORAGE_KEYS = [
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
];

export default function Settings() {
  const importRef = useRef<HTMLInputElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [name, setName] = useState("");
  const [defaultClass, setDefaultClass] = useState("");
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [classReminder, setClassReminder] = useState(true);
  const [prepReminder, setPrepReminder] = useState(true);

  const [prepTime, setPrepTime] = useState("2h");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const { cloudEnabled, user, syncStatus, signOut } = useClassenseCloud();

  useEffect(() => {
    const savedName = localStorage.getItem("app_name");
    const savedClass = localStorage.getItem("lastUsedClass");
    const savedClasses = JSON.parse(localStorage.getItem("classes") || "[]");

    const savedReminders = localStorage.getItem("remindersEnabled");
    const savedClassReminder = localStorage.getItem("classReminder");
    const savedPrep = localStorage.getItem("prepReminder");
    const savedPrepTime = localStorage.getItem("prepTime");
    const savedTheme = getStoredTheme();

    if (savedName) setName(savedName);
    if (savedClass) setDefaultClass(savedClass);
    if (savedClasses) setClasses(savedClasses);

    if (savedReminders) setRemindersEnabled(savedReminders === "true");
    if (savedClassReminder) setClassReminder(savedClassReminder === "true");
    if (savedPrep) setPrepReminder(savedPrep === "true");

    if (savedPrepTime) setPrepTime(savedPrepTime);
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth <= 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const handleSave = () => {
    localStorage.setItem("app_name", name);
    localStorage.setItem("lastUsedClass", defaultClass);

    localStorage.setItem("remindersEnabled", remindersEnabled.toString());
    localStorage.setItem("classReminder", classReminder.toString());
    localStorage.setItem("prepReminder", prepReminder.toString());
    localStorage.setItem("prepTime", prepTime);
    saveTheme(theme);

    alert("Saved ✓");
  };

  const handleClear = () => {
    const confirmText = prompt("Type DELETE to confirm reset");
    if (confirmText !== "DELETE") return;

    CLASSENSE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    location.reload();
  };

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app_name: localStorage.getItem("app_name") || "",
      lastUsedClass: localStorage.getItem("lastUsedClass") || "",
      remindersEnabled: localStorage.getItem("remindersEnabled") ?? "true",
      classReminder: localStorage.getItem("classReminder") ?? "true",
      prepReminder: localStorage.getItem("prepReminder") ?? "true",
      prepTime: localStorage.getItem("prepTime") || "2h",
      app_theme: localStorage.getItem("app_theme") || theme,
      classes: JSON.parse(localStorage.getItem("classes") || "[]"),
      logs: JSON.parse(localStorage.getItem("logs") || "[]"),
      plannerEvents: JSON.parse(localStorage.getItem("plannerEvents") || "[]"),
      library: JSON.parse(localStorage.getItem("library") || "[]"),
      reminders: JSON.parse(localStorage.getItem("reminders") || "[]"),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `classense-backup-${stamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      localStorage.setItem("app_name", data.app_name || "");
      localStorage.setItem("lastUsedClass", data.lastUsedClass || "");
      localStorage.setItem("remindersEnabled", String(data.remindersEnabled ?? true));
      localStorage.setItem("classReminder", String(data.classReminder ?? true));
      localStorage.setItem("prepReminder", String(data.prepReminder ?? true));
      localStorage.setItem("prepTime", data.prepTime || "2h");
      localStorage.setItem("app_theme", data.app_theme || "light");
      localStorage.setItem("classes", JSON.stringify(data.classes || []));
      localStorage.setItem("logs", JSON.stringify(data.logs || []));
      localStorage.setItem("plannerEvents", JSON.stringify(data.plannerEvents || []));
      localStorage.setItem("library", JSON.stringify(data.library || []));
      localStorage.setItem("reminders", JSON.stringify(data.reminders || []));

      alert("Backup imported ✓");
      location.reload();
    } catch {
      alert("That backup file could not be imported.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div style={{ ...container, padding: isMobile ? 16 : 20 }}>
      <div style={header}>
        <h2 style={title}>Settings</h2>
        <div style={subtitle}>
          Adjust appearance, reminders, defaults, and app preferences in one place.
        </div>
      </div>

      {cloudEnabled && (
        <div style={card}>
          <div style={sectionKicker}>Account</div>
          <div style={sectionTitle}>Classense Cloud</div>
          <div style={helper}>
            {user?.email ? `Signed in as ${user.email}.` : "No account connected."}
          </div>
          <div style={helper}>{syncStatus}</div>
          {user && (
            <button
              onClick={() => void signOut()}
              style={secondaryBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      )}

      {/* PROFILE */}
      <div style={card}>
        <div style={sectionKicker}>Profile</div>
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
        <div style={sectionKicker}>Defaults</div>
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
        <div style={sectionKicker}>Appearance</div>
        <div style={sectionTitle}>Appearance</div>
        <div style={helper}>
          Choose manual light or dark mode, or let Classense switch automatically.
        </div>

        <select
          value={theme}
          onChange={(e) => {
            const nextTheme = e.target.value as ThemeMode;
            setTheme(nextTheme);
            saveTheme(nextTheme);
          }}
          style={input}
        >
          <option value="auto">Automatic (7 AM light / 7 PM dark)</option>
          <option value="light">Light Mode</option>
          <option value="dark">Dark Mode</option>
        </select>

        <div style={helper}>
          Default schedule: light from {AUTO_LIGHT_START_HOUR}:00 to {AUTO_DARK_START_HOUR}:00,
          dark overnight.
        </div>
      </div>

      <div style={card}>
        <div style={sectionKicker}>Reminders</div>
        <div style={sectionTitle}>Reminders</div>
        <div style={helper}>
          Control whether lesson and class reminders are created by default.
        </div>

        <Toggle mobile={isMobile} label="Enable Reminders" value={remindersEnabled} setValue={setRemindersEnabled} />
        <Toggle mobile={isMobile} label="Class Reminder" value={classReminder} setValue={setClassReminder} />
        <Toggle mobile={isMobile} label="Lesson Prep Reminder" value={prepReminder} setValue={setPrepReminder} />
      </div>

      {/* TIMING */}
      <div style={card}>
        <div style={sectionKicker}>Timing</div>
        <div style={sectionTitle}>Prep Reminder Timing</div>
        <div style={helper}>
          Choose how far in advance you want prep reminders to fire.
        </div>

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
        <div style={sectionKicker}>Notifications</div>
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
        <div style={sectionKicker}>Data</div>
        <div style={sectionTitle}>Data</div>
        <div style={helper}>
          Resetting clears your saved classes, logs, library, planner items, and reminders.
        </div>

        <button
          onClick={handleExport}
          style={secondaryBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
          }}
        >
          Export Backup
        </button>

        <button
          onClick={() => importRef.current?.click()}
          style={secondaryBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
          }}
        >
          Import Backup
        </button>

        <input
          ref={importRef}
          type="file"
          accept="application/json"
          onChange={handleImport}
          style={{ display: "none" }}
        />

        <div style={helper}>
          Export saves your app data as a backup file. Import restores that backup later if
          you switch devices, clear browser data, or reset the app.
        </div>

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
function Toggle({ label, value, setValue, mobile = false }) {
  return (
    <div style={{ ...toggleRow, flexDirection: mobile ? "column" : "row", alignItems: mobile ? "stretch" : "center" }}>
      <span>{label}</span>

      <div style={{ display: "flex", alignItems: "center", justifyContent: mobile ? "space-between" : "flex-start", gap: 8 }}>
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

const header = {
  padding: "0 0 0 14px",
  borderLeft: "4px solid rgba(37, 99, 235, 0.82)",
  boxShadow: "inset 1px 0 0 rgba(255,255,255,0.2)",
  marginBottom: 16,
};

const title = {
  fontSize: 22,
  fontWeight: 600,
  marginBottom: 0,
  color: "var(--page-title)",
  textShadow: "0 1px 0 rgba(255,255,255,0.12)",
};

const subtitle = {
  fontSize: 15,
  lineHeight: 1.45,
  color: "var(--page-subtitle)",
  marginTop: 8,
  fontWeight: 500,
};

const card = {
  background: "var(--surface-soft)",
  backdropFilter: "blur(6px)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 16,
  marginBottom: 12,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  boxShadow: "var(--shadow-soft)",
  color: "var(--text)",
};

const sectionKicker = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: -2,
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: 600,
  color: "var(--text)",
};

const input = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid var(--border)",
  boxSizing: "border-box",
  background: "var(--input-bg)",
  color: "var(--text)",
};

const helper = {
  fontSize: 13,
  lineHeight: 1.45,
  color: "var(--muted)",
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
  background: "var(--ghost-bg)",
  border: "1px solid var(--border)",
  cursor: "pointer",
  transition: "all 0.2s ease",
  color: "var(--text)",
};

const dangerBtn = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  background:
    "linear-gradient(135deg, #7f1d1d, #b91c1c, #ef4444, #b91c1c, #7f1d1d)",
  backgroundSize: "200% 200%",
  color: "#fff5f5",
  border: "1px solid rgba(248, 113, 113, 0.38)",
  cursor: "pointer",
  transition: "all 0.2s ease",
  fontWeight: 700,
  boxShadow:
    "inset 0 1px 2px rgba(255,255,255,0.22), 0 10px 24px rgba(127,29,29,0.26)",
};

const toggleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const toggleLabel = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text)",
};

const toggleTrack = {
  width: 48,
  height: 24,
  borderRadius: 999,
  padding: 2,
  display: "flex",
  alignItems: "center",
  transition: "all 0.2s ease",
  border: "none",
};

const toggleThumb = {
  width: 20,
  height: 20,
  background: "var(--surface)",
  borderRadius: "50%",
  transition: "all 0.2s ease",
};
