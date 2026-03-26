"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateReminderTime } from "../utils/reminders";

type ClassItem = { name: string; time?: string };

type Log = {
  id: number;
  className: string;
  classTime?: string;
  title: string;
  date: string;
  content: string;
  tags: string[];
  references: string;
};
const formatTime = (t?: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};
export default function Logs() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);

  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditor, setIsEditor] = useState(false);

  const [selectedClass, setSelectedClass] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [references, setReferences] = useState("");

  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const today = () => new Date().toISOString().split("T")[0];

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2000);
  };

  useEffect(() => {
    const savedClasses = localStorage.getItem("classes");
    const savedLogs = localStorage.getItem("logs");
    const lastClass = localStorage.getItem("lastUsedClass");
    const openId = localStorage.getItem("openLogId");

    const parsedClasses: ClassItem[] = savedClasses ? JSON.parse(savedClasses) : [];
    const parsedLogs: Log[] = savedLogs ? JSON.parse(savedLogs) : [];

    setClasses(parsedClasses);
    setLogs(parsedLogs);

    if (lastClass) setSelectedClass(lastClass);

    if (openId) {
      const found = parsedLogs.find((log) => log.id === Number(openId));
      if (found) {
        setSelectedLog(found);
        localStorage.removeItem("openLogId");
      }
    }
  }, []);

  const saveLogs = (data: Log[]) => {
    setLogs(data);
    localStorage.setItem("logs", JSON.stringify(data));
  };

  const getClassTime = (className: string) => {
    const found = classes.find((c) => c.name === className);
    return found?.time || "18:00";
  };

  const resetEditor = () => {
    const lastClass = localStorage.getItem("lastUsedClass") || "";
    setSelectedClass(lastClass);
    setTitle("");
    setDate(today());
    setContent("");
    setTags([]);
    setTagInput("");
    setReferences("");
    setEditingId(null);
  };

  const handleNewLesson = () => {
    resetEditor();
    setSelectedLog(null);
    setIsEditor(true);
  };

  const handleOpen = (log: Log) => {
    setSelectedLog(log);
    setIsEditor(false);
  };

  const handleEdit = (log: Log) => {
    setSelectedClass(log.className);
    setTitle(log.title);
    setDate(log.date);
    setContent(log.content);
    setTags(log.tags || []);
    setTagInput("");
    setReferences(log.references || "");
    setEditingId(log.id);
    setSelectedLog(null);
    setIsEditor(true);
  };

  const handleDelete = (id: number) => {
    const updated = logs.filter((log) => log.id !== id);
    saveLogs(updated);
    setSelectedLog(null);
    showMessage("Deleted");
  };

  const handleDuplicate = (log: Log) => {
    const copy: Log = {
      ...log,
      id: Date.now(),
      title: `${log.title} (copy)`,
      date: today(),
    };
    saveLogs([copy, ...logs]);
    showMessage("Duplicated");
  };

  const handleShare = async (log: Log) => {
    const text = [
      `Lesson: ${log.title}`,
      `Class: ${log.className}`,
      `Time: ${log.classTime || getClassTime(log.className)}`,
      `Date: ${log.date}`,
      "",
      "Lesson Plan:",
      log.content,
      "",
      `Tags: ${log.tags.join(", ")}`,
      "",
      "References / Links:",
      log.references,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      showMessage("Copied ✓");
    } catch {
      showMessage("Copy failed");
    }
  };

  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  const handlePDF = (log: Log) => {
    const win = window.open("", "_blank");
    if (!win) {
      showMessage("Popup blocked");
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>${escapeHtml(log.title)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; line-height: 1.5; }
            h1 { margin-bottom: 8px; }
            .meta { color: #555; margin-bottom: 20px; }
            .box { border: 1px solid #ccc; padding: 12px; white-space: pre-wrap; }
            .section { margin-top: 18px; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(log.title)}</h1>
          <div class="meta">${escapeHtml(log.className)} • ${escapeHtml(log.date)} • ${escapeHtml(log.classTime || getClassTime(log.className))}</div>

          <div class="section">
            <strong>Lesson Plan</strong>
            <div class="box">${escapeHtml(log.content)}</div>
          </div>

          <div class="section">
            <strong>Tags</strong>
            <div>${escapeHtml(log.tags.join(", "))}</div>
          </div>

          <div class="section">
            <strong>References / Links</strong>
            <div class="box">${escapeHtml(log.references)}</div>
          </div>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
  };

  const addTag = (raw?: string) => {
    const clean = (raw ?? tagInput).trim().toLowerCase();
    if (!clean) return;

    if (!tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
      showMessage("Tag added ✓");
    }

    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const toggleFilterTag = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const aiSuggestedTags = useMemo(() => {
    const text = `${title} ${content}`.toLowerCase();
    const suggestions: string[] = [];

    const rules: Record<string, string[]> = {
      tango: ["tango", "ocho", "ochos", "close embrace", "corte"],
      waltz: ["waltz", "rise", "fall", "box step"],
      swing: ["swing", "triple step", "rock step", "jive"],
      rumba: ["rumba", "cuban motion", "spot turn"],
      foxtrot: ["foxtrot", "feather", "promenade"],
      "cha-cha": ["cha cha", "cha-cha", "chacha"],
      turns: ["turn", "turns", "spin", "pivot", "rotation"],
      footwork: ["foot", "feet", "heel", "toe", "step", "steps"],
      posture: ["posture", "frame", "hold"],
      connection: ["lead", "follow", "connection", "partner"],
      timing: ["timing", "count", "counts", "rhythm", "music"],
      basics: ["basic", "basics", "beginner", "foundation"],
      drills: ["drill", "drills", "repeat"],
      warmup: ["warm up", "warmup"],
      practice: ["practice", "practise", "guided practice"],
    };

    Object.entries(rules).forEach(([tag, keywords]) => {
      if (keywords.some((keyword) => text.includes(keyword))) {
        suggestions.push(tag);
      }
    });

    return Array.from(new Set(suggestions)).filter((tag) => !tags.includes(tag));
  }, [title, content, tags]);

  const aiTips = useMemo(() => {
    const tips: string[] = [];
    const text = content.toLowerCase();

    if (content.trim().length < 20) {
      tips.push("Add a bit more detail so the lesson is easier to reuse later.");
    }
    if (!text.includes("warm")) {
      tips.push("Consider adding a warm-up section.");
    }
    if (!text.includes("practice")) {
      tips.push("Consider adding guided practice time.");
    }
    if (!references.trim()) {
      tips.push("Add music, video, or notes in References / Links.");
    }

    return tips;
  }, [content, references]);

  const relatedLessons = useMemo(() => {
    const titleWords = title.toLowerCase().split(/\s+/).filter(Boolean);
    const contentWords = content.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const signalWords = Array.from(new Set([...titleWords, ...contentWords])).slice(0, 8);

    return logs
      .filter((log) => (editingId ? log.id !== editingId : true))
      .filter((log) => {
        const hay = `${log.title} ${log.content} ${log.tags.join(" ")} ${log.className}`.toLowerCase();
        return (
          (selectedClass && log.className === selectedClass) ||
          signalWords.some((word) => hay.includes(word)) ||
          aiSuggestedTags.some((tag) => log.tags.includes(tag))
        );
      })
      .slice(0, 3);
  }, [logs, editingId, selectedClass, title, content, aiSuggestedTags]);

  const handleAutoWrite = () => {
    const danceLabel = selectedClass || "this class";
    const lessonLabel = title.trim() || "Lesson";

    const auto = [
      `${lessonLabel}`,
      "",
      "Warm-up",
      `- Gentle movement warm-up for ${danceLabel}`,
      "- Review posture, frame, and timing",
      "",
      "Main Focus",
      "- Introduce or review core technique",
      "- Break down steps slowly",
      "- Partner practice with counts",
      "",
      "Practice",
      "- Guided repetition",
      "- Music round",
      "- Quick corrections and recap",
    ].join("\n");

    setContent((prev) => (prev.trim() ? prev : auto));
    showMessage("AI draft added ✓");
  };

  const handleSave = () => {
    if (!selectedClass || !title || !date || !content.trim()) {
      showMessage("Class, date, title, and lesson plan are required");
      return;
    }

    const mergedTags = Array.from(new Set([...tags, ...aiSuggestedTags]));
const classTime = getClassTime(selectedClass);
    const payload: Log = {
  id: editingId ?? Date.now(),
  className: selectedClass,
 classTime,
  title,
  date,
  content,
  tags: mergedTags,
  references,
};

    const updated =
      editingId !== null
        ? logs.map((log) => (log.id === editingId ? payload : log))
        : [payload, ...logs];

    saveLogs(updated);
    localStorage.setItem("lastUsedClass", selectedClass);

    const remindersEnabled = localStorage.getItem("remindersEnabled") === "true";
    const prepReminder = localStorage.getItem("prepReminder") === "true";
    const prepTime = localStorage.getItem("prepTime") || "2h";

    if (remindersEnabled && prepReminder) {
      const fullDateTime = date && classTime
        ? new Date(`${date}T${classTime}:00`)
        : new Date();

      if (isNaN(fullDateTime.getTime())) {
        showMessage("Invalid class date/time");
        return;
      }

      const reminderTime = calculateReminderTime(
        fullDateTime.toISOString(),
        prepTime
      );

      const existing = JSON.parse(localStorage.getItem("reminders") || "[]");

      const newReminder = {
        id: Date.now(),
        logId: payload.id,
        title: payload.title,
        className: payload.className,
        lessonDate: payload.date,
        classTime,
        remindAt:
          reminderTime && !isNaN(new Date(reminderTime).getTime())
            ? new Date(reminderTime).toISOString()
            : "",
        type: "prep",
      };

      localStorage.setItem(
        "reminders",
        JSON.stringify([newReminder, ...existing])
      );
    }

    setIsEditor(false);
    setSelectedLog(payload);
    showMessage("Saved ✓");
  };

  const allTags = useMemo(
    () => Array.from(new Set(logs.flatMap((log) => log.tags))).sort(),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return logs.filter((log) => {
      const text = [
        log.title,
        log.className,
        log.classTime || "",
        log.date,
        log.content,
        log.references,
        log.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || text.includes(q);
      const matchesClass = !filterClass || log.className === filterClass;
      const matchesTags =
        filterTags.length === 0 || filterTags.every((tag) => log.tags.includes(tag));

      return matchesSearch && matchesClass && matchesTags;
    });
  }, [logs, search, filterClass, filterTags]);

  const Toast = () =>
    message ? (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-xl shadow-lg z-50">
        {message}
      </div>
    ) : null;


  const metallicBlueBtn: React.CSSProperties = {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #1e3a8a, #2563eb, #60a5fa, #2563eb, #1e3a8a)",
    backgroundSize: "200% 200%",
    color: "#fff",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "inset 0 1px 2px rgba(255,255,255,0.35), 0 10px 22px rgba(37,99,235,0.25)",
  };

  const darkBtn: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500,
  };

  const whiteBtn: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 500,
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
  
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.6)",
  
    boxShadow: "0 6px 18px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  
    transition: "all 0.2s ease",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(0,0,0,0.06)",
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    fontSize: "14px",
    fontFamily: "inherit", // ✅ THIS is the key fix
    outline: "none",
    transition: "all 0.2s ease",
  };

  const tagStyle: React.CSSProperties = {
    display: "inline-block",
    background: "#e5e7eb",
    padding: "4px 8px",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
  };

  const shellStyle: React.CSSProperties = {
    padding: 20,
    background: "#f5f7fa",
    minHeight: "100%",
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  if (isEditor) {
    return (
      <div style={shellStyle}>
        <Toast />
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              borderRadius: "16px",
              padding: "18px",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <button onClick={() => setIsEditor(false)} style={whiteBtn}>
                ← Back
              </button>
            </div>
  
            <div style={{ display: "grid", gap: 12 }}>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select Class</option>
                {classes.map((c, i) => (
                  <option key={`${c.name}-${i}`} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
  
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
  
              <input
                type="time"
                value={getClassTime(selectedClass)}
                readOnly
                style={inputStyle}
              />
  
              <input
                placeholder="Lesson Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />
  
              <textarea
                placeholder="Lesson Plan"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ ...inputStyle, minHeight: "40vh", resize: "vertical" }}
              />
  
              <div style={{ ...cardStyle, background: "#f3f4f6" }}>
                <div style={{ fontWeight: 600, marginBottom: 10 }}>AI Brain</div>
  
                <button
                  onClick={handleAutoWrite}
                  style={{ ...darkBtn, marginBottom: 12 }}
                >
                  Auto Write Draft
                </button>
  
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Suggested Tags
                  </div>
                  {aiSuggestedTags.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {aiSuggestedTags.map((tag) => (
                        <span
                          key={tag}
                          onClick={() => addTag(tag)}
                          style={{ ...tagStyle, background: "#dbeafe" }}
                        >
                          + {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      Start typing and suggestions will show here.
                    </div>
                  )}
                </div>
  
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Suggestions
                  </div>
                  {aiTips.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gap: 4,
                        fontSize: 13,
                        color: "#374151",
                      }}
                    >
                      {aiTips.map((tip, i) => (
                        <div key={i}>• {tip}</div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      Looking good so far.
                    </div>
                  )}
                </div>
  
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Related Past Lessons
                  </div>
                  {relatedLessons.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gap: 4,
                        fontSize: 13,
                        color: "#374151",
                      }}
                    >
                      {relatedLessons.map((log) => (
                        <div key={log.id}>
                          {log.title} · {log.className} · {log.date}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      No close matches yet.
                    </div>
                  )}
                </div>
              </div>
  
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
                <button onClick={() => addTag()} style={darkBtn}>
                  Add
                </button>
              </div>
  
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => removeTag(tag)}
                    style={tagStyle}
                  >
                    {tag} ✕
                  </span>
                ))}
              </div>
  
              <textarea
                placeholder="References / Links"
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                style={{
                  ...inputStyle,
                  minHeight: 100,
                  resize: "vertical",
                }}
              />
  
              <button
                onClick={handleSave}
                style={metallicBlueBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(-2px) scale(1.01)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 24px rgba(37,99,235,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow =
                    "inset 0 1px 2px rgba(255,255,255,0.35), 0 10px 22px rgba(37,99,235,0.25)";
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (selectedLog) {
    return (
      <div style={shellStyle}>
        <Toast />
  
        <div style={{ marginBottom: 14 }}>
          <button onClick={() => setSelectedLog(null)} style={whiteBtn}>← Back</button>
        </div>
  
        <div style={cardStyle}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>{selectedLog.title}</h2>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>
            {selectedLog.className} • {selectedLog.date} • {selectedLog.classTime || getClassTime(selectedLog.className)}
          </div>
  
          <div style={{ ...cardStyle, boxShadow: "none", marginBottom: 14 }}>
            <div style={{ whiteSpace: "pre-wrap" }}>{selectedLog.content}</div>
          </div>
  
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {selectedLog.tags.map((tag) => (
              <span
                key={tag}
                onClick={() => {
                  setSelectedLog(null);
                  setFilterTags([tag]);
                }}
                style={tagStyle}
              >
                {tag}
              </span>
            ))}
          </div>
  
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>References / Links</div>
  
            <div>
              {(selectedLog.references || "")
                .split("\n")
                .map((line, i) => {
                  const match = line.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  
                  if (!match) return <div key={i}>{line}</div>;
  
                  const url = match[0].startsWith("http")
                    ? match[0]
                    : `https://${match[0]}`;
  
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#2563eb", textDecoration: "underline", display: "block" }}
                    >
                      {line}
                    </a>
                  );
                })}
            </div>
          </div>
  
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => handleEdit(selectedLog)} style={darkBtn}>Edit</button>
            <button onClick={() => handleDelete(selectedLog.id)} style={darkBtn}>Delete</button>
            <button onClick={() => handleDuplicate(selectedLog)} style={darkBtn}>Duplicate</button>
            <button onClick={() => handleShare(selectedLog)} style={darkBtn}>Share</button>
            <button onClick={() => handlePDF(selectedLog)} style={darkBtn}>PDF</button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={shellStyle}>
      <Toast />
  
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Logs</h1>
  
        <button
          onClick={handleNewLesson}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg, #6366f1, #3b82f6)",
            color: "white",
            fontWeight: 600,
            fontSize: "15px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
            e.currentTarget.style.boxShadow =
              "0 10px 24px rgba(59,130,246,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          New Lesson
        </button>
      </div>
  
      <div
        style={{
          ...cardStyle,
          marginBottom: 16,
          padding: 16,
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <input
            placeholder="Search title, content, class, tags, links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.border = "1px solid rgba(99,102,241,0.4)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = "1px solid rgba(0,0,0,0.06)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
  
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            style={inputStyle}
          >
            <option value="">All Classes</option>
            {classes.map((c, i) => (
              <option key={`${c.name}-${i}`} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
  
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Filter by Tags</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allTags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => toggleFilterTag(tag)}
                  style={filterTags.includes(tag) ? activeTagStyle : tagStyle}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
  
          {(search || filterClass || filterTags.length > 0) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterClass("");
                setFilterTags([]);
              }}
              style={whiteBtn}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
  
      <div style={{ display: "grid", gap: 12 }}>
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            onClick={() => handleOpen(log)}
            style={{
              ...cardStyle,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px) scale(1.01)";
              e.currentTarget.style.boxShadow =
                "0 14px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(99,102,241,0.08)";
              e.currentTarget.style.background = "rgba(255,255,255,0.95)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow =
                "0 6px 18px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)";
              e.currentTarget.style.background = "rgba(255,255,255,0.85)";
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 2 }}>
              {log.title}
            </div>
  
            <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.4 }}>
              {log.className} • {new Date(log.date).toLocaleDateString()} • {formatTime(log.classTime || getClassTime(log.className))}
            </div>
  
            {log.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {log.tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFilterTag(tag);
                    }}
                    style={filterTags.includes(tag) ? activeTagStyle : tagStyle}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
  } 