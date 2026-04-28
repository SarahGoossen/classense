"use client";
import { useState, useEffect } from "react";
import { subscribeClassenseStorageSync } from "../utils/storageSync";

const days = [
  "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
];

export default function Classes() {
  const [isMobile, setIsMobile] = useState(false);
  const [newClass, setNewClass] = useState("");
  const [newDay, setNewDay] = useState(1);
  const [newTime, setNewTime] = useState("19:00");

  const [classes, setClasses] = useState<any[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingDay, setEditingDay] = useState(1);
  const [editingTime, setEditingTime] = useState("19:00");

  const loadClasses = () => {
    const saved = JSON.parse(localStorage.getItem("classes") || "[]");

    const fixed = saved.map((c: any) => ({
      ...c,
      day: typeof c.day === "number" ? c.day : 1,
      time: c.time || "19:00",
    }));

    setClasses(fixed);

    if (JSON.stringify(saved) !== JSON.stringify(fixed)) {
      localStorage.setItem("classes", JSON.stringify(fixed));
    }
  };

  useEffect(() => {
    loadClasses();
    const unsubscribeSync = subscribeClassenseStorageSync(loadClasses);
    return () => unsubscribeSync();
  }, []);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth <= 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const saveNow = (updated: any[]) => {
    setClasses(updated);
    localStorage.setItem("classes", JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!newClass.trim()) return;

    const updated = [
      ...classes,
      {
        id: Date.now(),
        name: newClass,
        day: newDay,
        time: newTime,
      },
    ];

    saveNow(updated);
    setNewClass("");
    setNewDay(1);
    setNewTime("19:00");
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Delete this class?")) return;
    saveNow(classes.filter((c) => c.id !== id));
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditingValue(item.name);
    setEditingDay(item.day ?? 1);
    setEditingTime(item.time || "19:00");
  };

  const saveEdit = () => {
    const updated = classes.map((c) =>
      c.id === editingId
        ? {
            ...c,
            name: editingValue,
            day: editingDay,
            time: editingTime,
          }
        : c
    );

    saveNow(updated);
    setEditingId(null);
    setEditingValue("");
    setEditingDay(1);
    setEditingTime("19:00");
  };

  return (
    <div style={{ ...container, padding: isMobile ? 16 : 20 }}>
      <div style={header}>
        <h2 style={title}>Classes</h2>
        <div style={subtitle}>
          Build your teaching schedule here first, then attach lessons to each class.
        </div>
      </div>

      {/* ADD */}
      <div style={inputCard}>
        <input
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
          placeholder="Add new class..."
          style={inputFull}
        />

        <div style={inputRow}>
          <select
            value={newDay}
            onChange={(e) => setNewDay(Number(e.target.value))}
            style={{ ...select, flex: isMobile ? "1 1 44%" : select.flex }}
          >
            {days.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>

          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            style={{ ...select, flex: isMobile ? "1 1 36%" : select.flex }}
          />

          <button
            onClick={handleAdd}
            style={{ ...btn, width: isMobile ? "100%" : "auto" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* LIST */}
      <div style={{ marginTop: 20 }}>
        {classes.length === 0 && (
          <div style={emptyCard}>
            <div style={className}>No classes yet</div>
            <div style={dayLabel}>
              Add your first class above to start organizing lessons and planning.
            </div>
          </div>
        )}

        {classes.map((c) => (
          <div
            key={c.id}
            style={{ ...card, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
            }}
          >
            {editingId === c.id ? (
              <>
                <input
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  style={inputInline}
                />

                <select
                  value={editingDay}
                  onChange={(e) => setEditingDay(Number(e.target.value))}
                  style={selectInline}
                >
                  {days.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>

                <input
                  type="time"
                  value={editingTime}
                  onChange={(e) => setEditingTime(e.target.value)}
                  style={selectInline}
                />

                <div style={{ ...actions, width: isMobile ? "100%" : "auto", justifyContent: "flex-start", flexWrap: "wrap" }}>
                  <button
                    onClick={saveEdit}
                    style={editBtn}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setEditingId(null)}
                    style={deleteBtn}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div style={className}>{c.name}</div>
                  <div style={dayLabel}>
                    {days[c.day ?? 1]} • {c.time}
                  </div>
                </div>

                <div style={{ ...actions, width: isMobile ? "100%" : "auto", justifyContent: "flex-start", flexWrap: "wrap" }}>
                  <button
                    onClick={() => startEdit(c)}
                    style={editBtn}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(c.id)}
                    style={deleteBtn}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* STYLES */

const container = {
  padding: 20,
  maxWidth: 700,
  margin: "0 auto",
};

const header = {
  padding: "0 0 0 14px",
  borderLeft: "4px solid rgba(37, 99, 235, 0.82)",
  boxShadow: "inset 1px 0 0 rgba(255,255,255,0.18)",
  marginBottom: 22,
};

const title = {
  fontSize: 26,
  fontWeight: 650,
  marginBottom: 0,
  color: "var(--page-title)",
  textShadow: "0 1px 0 rgba(255,255,255,0.12)",
  letterSpacing: "-0.02em",
};

const subtitle = {
  fontSize: 15,
  lineHeight: 1.6,
  color: "var(--page-subtitle)",
  marginTop: 8,
  fontWeight: 500,
  maxWidth: "46ch",
};

const inputCard = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  background: "var(--premium-panel)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(148,163,184,0.18)",
  padding: 16,
  borderRadius: 20,
  boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: 10,
  borderRadius: 8,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.04)",
};

const inputFull = {
  ...input,
};

const inputRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const select = {
  flex: "1 1 140px",
  minWidth: 0,
  boxSizing: "border-box",
  padding: 10,
  borderRadius: 8,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.04)",
};

const inputInline = {
  flex: 1,
  padding: 8,
  borderRadius: 6,
  border: "1px solid var(--border-strong)",
  background: "var(--input-bg)",
  color: "var(--text)",
};

const selectInline = {
  padding: 8,
  borderRadius: 6,
  border: "1px solid var(--border-strong)",
  background: "var(--input-bg)",
  color: "var(--text)",
};

const btn = {
  flex: "0 0 auto",
  minWidth: 88,
  padding: "11px 18px",
  borderRadius: 12,
  background: "linear-gradient(135deg, #1e3a8a, #2563eb, #60a5fa)",
  color: "#ffffff",
  cursor: "pointer",
  transition: "all 0.15s ease",
  border: "none",
  fontWeight: 700,
  boxShadow: "0 8px 18px rgba(37, 99, 235, 0.28)",
};

const card = {
  background: "var(--premium-panel)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(148,163,184,0.16)",
  borderRadius: 18,
  padding: 16,
  marginBottom: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  transition: "all 0.2s ease",
  boxShadow: "0 14px 28px rgba(15,23,42,0.07)",
  color: "var(--text)",
};

const emptyCard = {
  ...card,
  cursor: "default",
};

const className = {
  fontWeight: 650,
  fontSize: 16,
  color: "var(--text)",
};

const dayLabel = {
  fontSize: 13,
  color: "var(--muted)",
  lineHeight: 1.4,
};

const actions = {
  display: "flex",
  gap: 10,
};

const editBtn = {
  color: "var(--text)",
  background: "var(--edit-surface)",
  border: "1px solid var(--border)",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  borderRadius: 10,
  padding: "8px 13px",
  minWidth: 72,
  minHeight: 36,
  textAlign: "center" as const,
};

const deleteBtn = {
  color: "var(--danger-text)",
  background: "var(--danger-bg)",
  border: "1px solid var(--danger-border)",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  borderRadius: 10,
  padding: "8px 13px",
  minWidth: 72,
  minHeight: 36,
  textAlign: "center" as const,
};
