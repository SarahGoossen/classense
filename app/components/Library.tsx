"use client";
import { useState, useEffect, useMemo } from "react";
import { subscribeClassenseStorageSync } from "../utils/storageSync";

export default function Library() {
  const [isMobile, setIsMobile] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const loadLibrary = () => {
    const saved = JSON.parse(localStorage.getItem("library") || "[]");
    const savedClasses = JSON.parse(localStorage.getItem("classes") || "[]");
    setItems(saved);
    setClasses(savedClasses);
  };

  useEffect(() => {
    loadLibrary();
    const unsubscribeSync = subscribeClassenseStorageSync(loadLibrary);
    return () => unsubscribeSync();
  }, []);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth <= 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const formatLink = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return "https://" + url;
  };

  const saveNow = (updated: any[]) => {
    setItems(updated);
    localStorage.setItem("library", JSON.stringify(updated));
  };

  const handleSave = () => {
    if (!title.trim()) return;

    let updated;

    if (editingId !== null) {
      updated = items.map((i) =>
        i.id === editingId
          ? { ...i, title, notes, link, className: selectedClass }
          : i
      );
      setEditingId(null);
    } else {
      updated = [
        ...items,
        {
          id: Date.now(),
          title,
          notes,
          link,
          className: selectedClass,
        },
      ];
    }

    saveNow(updated);
    setTitle("");
    setNotes("");
    setLink("");
    setSelectedClass("");
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Delete this library item?")) return;
    saveNow(items.filter((i) => i.id !== id));
  };

  const handleEdit = (item: any) => {
    setTitle(item.title);
    setNotes(item.notes);
    setLink(item.link);
    setSelectedClass(item.className);
    setEditingId(item.id);
  };

  const normalize = (text: string) =>
    text.toLowerCase().replace(/\s+/g, "").replace(/-/g, "");

  const filteredItems = useMemo(() => {
    const q = normalize(search);
    if (!q) return items;

    return items.filter((i) => {
      const combined = normalize(
        `${i.title} ${i.notes} ${i.className} ${i.link}`
      );
      return combined.includes(q);
    });
  }, [items, search]);

  return (
    <div style={{ ...container, padding: isMobile ? 16 : 20 }}>
      <div style={header}>
        <h2 style={titleStyle}>Library</h2>
        <div style={subtitle}>
          Keep your links, notes, and teaching references organized in one place.
        </div>
      </div>

      {/* FORM */}
      <div style={card}>
        <div style={sectionLabel}>Save Resource</div>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={input}
        />

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={input}
        >
          <option value="">No linked class</option>
          {classes.map((c) => (
            <option key={c.id || c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Link (YouTube / website)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          style={input}
        />

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={textarea}
        />

        <button
          onClick={handleSave}
          style={btn}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 10px 24px rgba(37,99,235,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "var(--shadow-soft)";
          }}
        >
          {editingId !== null ? "Update" : "Save Resource"}
        </button>
      </div>

      {/* SEARCH */}
      <div style={searchWrap}>
        <div style={sectionLabel}>Search</div>
        <input
          placeholder="Search title, notes, class, or link..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
        />
      </div>

      {/* LIST */}
      <div style={{ marginTop: 18 }}>
        <div style={listHeader}>
          <div style={listTitle}>Saved Resources</div>
          <div style={listHint}>Your lesson links, notes, and reusable references.</div>
        </div>

        {filteredItems.length === 0 && (
          <div style={emptyState}>
            <div style={emptyTitle}>No resources yet</div>
            <div style={emptyCopy}>
              Save a link, note, or teaching reference above and it will appear here.
            </div>
          </div>
        )}

        {filteredItems.map((i) => (
          <div
            key={i.id}
            style={itemCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 14px 28px rgba(15,23,42,0.14)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "var(--shadow-soft)";
            }}
          >
            <div style={{ ...itemTop, flexDirection: isMobile ? "column" : "row" }}>
              <div style={itemTitle}>{i.title}</div>
              {i.className && <div style={tag}>{i.className}</div>}
            </div>

            {i.link && (
              <a
                href={formatLink(i.link)}
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                Open Link
              </a>
            )}

            {i.notes && <div style={notesStyle}>{i.notes}</div>}

            <div style={{ ...actions, flexWrap: "wrap" }}>
              <button
                onClick={() => handleEdit(i)}
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
                onClick={() => handleDelete(i.id)}
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

const titleStyle = {
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
  maxWidth: "48ch",
};

const card = {
  background: "var(--premium-panel)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(148,163,184,0.16)",
  padding: 18,
  borderRadius: 20,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
  color: "var(--text)",
  marginBottom: 14,
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: 12,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--input-bg)",
  color: "var(--text)",
  fontFamily: "inherit",
};

const sectionLabel = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 2,
};

const searchWrap = {
  marginTop: 6,
};

const listHeader = {
  marginBottom: 10,
};

const listTitle = {
  fontSize: 16,
  fontWeight: 600,
  color: "var(--text)",
};

const listHint = {
  marginTop: 4,
  fontSize: 13,
  lineHeight: 1.45,
  color: "var(--muted)",
};

const textarea = {
  ...input,
  minHeight: 100,
  resize: "vertical",
};

const btn = {
  padding: 12,
  borderRadius: 14,
  background: "linear-gradient(135deg,#1e3a8a,#2563eb,#60a5fa)",
  color: "white",
  cursor: "pointer",
  border: "none",
  transition: "all 0.2s ease",
  fontWeight: 600,
  boxShadow: "var(--shadow-soft)",
};

const itemCard = {
  background: "var(--premium-panel)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(148,163,184,0.16)",
  borderRadius: 18,
  padding: 16,
  marginBottom: 14,
  transition: "all 0.2s ease",
  boxShadow: "0 14px 28px rgba(15,23,42,0.07)",
  color: "var(--text)",
};

const emptyState = {
  ...itemCard,
  cursor: "default",
};

const emptyTitle = {
  fontSize: 16,
  fontWeight: 650,
  marginBottom: 4,
  color: "var(--text)",
};

const emptyCopy = {
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--muted)",
};

const itemTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 10,
};

const itemTitle = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--text)",
};

const tag = {
  display: "inline-block",
  background: "var(--tag-surface)",
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 12,
  whiteSpace: "nowrap",
  color: "var(--tag-text)",
};

const linkStyle = {
  display: "block",
  marginTop: 6,
  color: "#2563eb",
  textDecoration: "underline",
  fontWeight: 500,
};

const notesStyle = {
  marginTop: 6,
  fontSize: 14,
  lineHeight: 1.5,
  color: "var(--muted)",
};

const actions = {
  marginTop: 10,
  display: "flex",
  gap: 10,
};

const editBtn = {
  minWidth: 72,
  minHeight: 36,
  color: "var(--text)",
  background: "var(--edit-surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 500,
};

const deleteBtn = {
  minWidth: 72,
  minHeight: 36,
  color: "#ef4444",
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.25)",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 500,
};
