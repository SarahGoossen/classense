"use client";
import { useState, useEffect } from "react";

const days = [
  "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
];

export default function Classes() {
  const [newClass, setNewClass] = useState("");
  const [newDay, setNewDay] = useState(1);
  const [newTime, setNewTime] = useState("19:00");

  const [classes, setClasses] = useState<any[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingDay, setEditingDay] = useState(1);
  const [editingTime, setEditingTime] = useState("19:00");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("classes") || "[]");

    const fixed = saved.map((c: any) => ({
      ...c,
      day: typeof c.day === "number" ? c.day : 1,
      time: c.time || "19:00",
    }));

    setClasses(fixed);
    localStorage.setItem("classes", JSON.stringify(fixed));
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
    <div style={container}>
      <h2 style={title}>Classes</h2>

      {/* ADD */}
      <div style={inputCard}>
        <input
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
          placeholder="Add new class..."
          style={input}
        />

        <select
          value={newDay}
          onChange={(e) => setNewDay(Number(e.target.value))}
          style={select}
        >
          {days.map((d, i) => (
            <option key={i} value={i}>{d}</option>
          ))}
        </select>

        <input
          type="time"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          style={select}
        />

        <button
          onClick={handleAdd}
          style={btn}
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

      {/* LIST */}
      <div style={{ marginTop: 20 }}>
        {classes.map((c) => (
          <div
            key={c.id}
            style={card}
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

                <div style={actions}>
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

                <div style={actions}>
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
  maxWidth: 520,
  margin: "0 auto",
};

const title = {
  fontSize: 22,
  fontWeight: 600,
  marginBottom: 15,
};

const inputCard = {
  display: "grid",
  gridTemplateColumns: "1fr 140px 140px auto",
  gap: 10,
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(255,255,255,0.6)",
  padding: 12,
  borderRadius: 14,
};

const input = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
};

const select = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
};

const inputInline = {
  flex: 1,
  padding: 8,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const selectInline = {
  padding: 8,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const btn = {
  padding: "10px 16px",
  borderRadius: 10,
  background: "black",
  color: "white",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const card = {
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(255,255,255,0.6)",
  borderRadius: 14,
  padding: 14,
  marginBottom: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  transition: "all 0.2s ease",
};

const className = {
  fontWeight: 600,
};

const dayLabel = {
  fontSize: 13,
  color: "#6b7280",
};

const actions = {
  display: "flex",
  gap: 10,
};

const editBtn = {
  color: "#2563eb",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
};

const deleteBtn = {
  color: "#ef4444",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
};