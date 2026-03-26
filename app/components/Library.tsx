"use client";
import { useState, useEffect, useMemo } from "react";

export default function Library() {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("library") || "[]");
    const savedClasses = JSON.parse(localStorage.getItem("classes") || "[]");
    setItems(saved);
    setClasses(savedClasses);
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
    <div style={container}>
      <h2 style={titleStyle}>Library</h2>

      {/* FORM */}
      <div style={card}>
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
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.name}>
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
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {editingId !== null ? "Update" : "Save Resource"}
        </button>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search title, notes, class, link..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...input, marginTop: 15 }}
      />

      {/* LIST */}
      <div style={{ marginTop: 20 }}>
        {filteredItems.map((i) => (
          <div
            key={i.id}
            style={itemCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
            }}
          >
            <div style={{ fontWeight: 600 }}>{i.title}</div>

            {i.className && <div style={tag}>{i.className}</div>}

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

            <div style={actions}>
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
  maxWidth: 520,
  margin: "0 auto",
};

const titleStyle = {
  fontSize: 22,
  fontWeight: 600,
  marginBottom: 15,
};

const card = {
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(255,255,255,0.6)",
  padding: 16,
  borderRadius: 14,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: 12,
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.7)",
  fontFamily: "inherit",
};

const textarea = {
  ...input,
  minHeight: 100,
  resize: "vertical",
};

const btn = {
  padding: 12,
  borderRadius: 12,
  background: "linear-gradient(135deg,#1e3a8a,#2563eb,#60a5fa)",
  color: "white",
  cursor: "pointer",
  border: "none",
  transition: "all 0.2s ease",
};

const itemCard = {
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(255,255,255,0.6)",
  borderRadius: 14,
  padding: 14,
  marginBottom: 12,
  transition: "all 0.2s ease",
};

const tag = {
  display: "inline-block",
  background: "#e5e7eb",
  padding: "4px 8px",
  borderRadius: 6,
  fontSize: 12,
  marginTop: 5,
};

const linkStyle = {
  display: "block",
  marginTop: 6,
  color: "#2563eb",
  textDecoration: "underline",
};

const notesStyle = {
  marginTop: 6,
  fontSize: 14,
  color: "#4b5563",
};

const actions = {
  marginTop: 10,
  display: "flex",
  gap: 10,
};

const editBtn = {
  color: "#2563eb",
  background: "none",
  border: "none",
  cursor: "pointer",
};

const deleteBtn = {
  color: "#ef4444",
  background: "none",
  border: "none",
  cursor: "pointer",
};