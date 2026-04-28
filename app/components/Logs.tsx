"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { calculateReminderTime } from "../utils/reminders";

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event?: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    0: {
      transcript: string;
    };
    isFinal: boolean;
  }>;
};

type SpeechRecognitionErrorLike = {
  error?: string;
};

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

const formatLessonDate = (value: string) => {
  if (!value) return "";

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return new Date(year, month - 1, day).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStoredPrepReminder = () => {
  const value = localStorage.getItem("prepReminder");
  return value === null ? true : value === "true";
};

const getStoredPrepTime = () => localStorage.getItem("prepTime") || "2h";

const getStoredRemindersEnabled = () => {
  const value = localStorage.getItem("remindersEnabled");
  return value === null ? true : value === "true";
};

const getFollowUpReminderDate = (option: string, customValue: string) => {
  const now = new Date();

  if (option === "custom") {
    const customDate = new Date(customValue);
    return isNaN(customDate.getTime()) ? null : customDate;
  }

  if (option === "tomorrow") {
    const reminder = new Date(now);
    reminder.setDate(reminder.getDate() + 1);
    reminder.setHours(9, 0, 0, 0);
    return reminder;
  }

  const laterToday = new Date(now);
  laterToday.setHours(18, 0, 0, 0);

  if (laterToday.getTime() <= now.getTime()) {
    laterToday.setTime(now.getTime() + 2 * 60 * 60 * 1000);
  }

  return laterToday;
};

export default function Logs() {
  const [isMobile, setIsMobile] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);

  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditor, setIsEditor] = useState(false);

  const [selectedClass, setSelectedClass] = useState("");
  const [lessonTime, setLessonTime] = useState("");
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
  const [enablePrepReminder, setEnablePrepReminder] = useState(true);
  const [prepReminderTime, setPrepReminderTime] = useState("2h");
  const [isDictating, setIsDictating] = useState(false);
  const [enableFollowUpReminder, setEnableFollowUpReminder] = useState(false);
  const [followUpReminderOption, setFollowUpReminderOption] = useState("later_today");
  const [followUpReminderCustomAt, setFollowUpReminderCustomAt] = useState("");
  const [draftReminderId, setDraftReminderId] = useState<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const dictationBufferRef = useRef("");
  const dictationBaseContentRef = useRef("");

  const today = () => new Date().toISOString().split("T")[0];

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2000);
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const savedClasses = localStorage.getItem("classes");
    const savedLogs = localStorage.getItem("logs");
    const lastClass = localStorage.getItem("lastUsedClass");
    const openId = localStorage.getItem("openLogId");
    const editId = localStorage.getItem("editLogId");

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

    if (editId) {
      const found = parsedLogs.find((log) => log.id === Number(editId));
      if (found) {
        setSelectedClass(found.className);
        setLessonTime(found.classTime || getClassTime(found.className));
        setTitle(found.title);
        setDate(found.date);
        setContent(found.content);
        setTags(found.tags || []);
        setTagInput("");
        setReferences(found.references || "");
        setEditingId(found.id);
        setSelectedLog(null);
        setIsEditor(true);
        setEnablePrepReminder(getStoredPrepReminder());
        setPrepReminderTime(getStoredPrepTime());
      }
      localStorage.removeItem("editLogId");
    }

    if (localStorage.getItem("openNewLesson") === "true") {
      setSelectedClass(lastClass || "");
      setLessonTime(getClassTime(lastClass || ""));
      setTitle("");
      setDate(today());
      setContent("");
      setTags([]);
      setTagInput("");
      setReferences("");
      setEditingId(null);
      setSelectedLog(null);
      setIsEditor(true);
      setEnablePrepReminder(getStoredPrepReminder());
      setPrepReminderTime(getStoredPrepTime());
      setEnableFollowUpReminder(false);
      setFollowUpReminderOption("later_today");
      setFollowUpReminderCustomAt("");
      setDraftReminderId(null);
      localStorage.removeItem("openNewLesson");
    }
  }, []);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth <= 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    localStorage.setItem("prepReminder", enablePrepReminder.toString());
  }, [enablePrepReminder]);

  useEffect(() => {
    localStorage.setItem("prepTime", prepReminderTime);
  }, [prepReminderTime]);

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
    setLessonTime(getClassTime(lastClass));
    setTitle("");
    setDate(today());
    setContent("");
    setTags([]);
    setTagInput("");
    setReferences("");
    setEditingId(null);
    setEnablePrepReminder(getStoredPrepReminder());
    setPrepReminderTime(getStoredPrepTime());
    setEnableFollowUpReminder(false);
    setFollowUpReminderOption("later_today");
    setFollowUpReminderCustomAt("");
    setDraftReminderId(null);
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
    setLessonTime(log.classTime || getClassTime(log.className));
    setTitle(log.title);
    setDate(log.date);
    setContent(log.content);
    setTags(log.tags || []);
    setTagInput("");
    setReferences(log.references || "");
    setEditingId(log.id);
    setSelectedLog(null);
    setIsEditor(true);
    setEnablePrepReminder(getStoredPrepReminder());
    setPrepReminderTime(getStoredPrepTime());
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

  const normalizeDictationText = (value: string) => {
    const cleaned = value
      .replace(/\s+/g, " ")
      .replace(/\s+([,.!?;:])/g, "$1")
      .replace(/\bi\b/g, "I")
      .trim();

    if (!cleaned) return "";

    const withCapital = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return /[.!?]$/.test(withCapital) ? withCapital : `${withCapital}.`;
  };

  const renderDictationIntoContent = (spokenText: string) => {
    const base = dictationBaseContentRef.current.trimEnd();
    const spoken = spokenText.trim();
    return `${base}${base && spoken ? "\n\n" : ""}${spoken}`;
  };

  const commitDictation = () => {
    const finalText = normalizeDictationText(dictationBufferRef.current);
    dictationBufferRef.current = "";

    if (!finalText) {
      setContent(dictationBaseContentRef.current);
      return;
    }

    setContent(renderDictationIntoContent(finalText));
  };

  const handleDictationToggle = () => {
    if (typeof window === "undefined") return;

    if (isDictating) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      showMessage("Voice dictation is not supported in this browser");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let liveTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalTranscript += `${result[0].transcript.trim()} `;
        } else {
          liveTranscript += `${result[0].transcript.trim()} `;
        }
      }

      if (finalTranscript.trim()) {
        dictationBufferRef.current = `${dictationBufferRef.current} ${finalTranscript}`.trim();
      }

      const combinedTranscript = [dictationBufferRef.current, liveTranscript.trim()]
        .filter(Boolean)
        .join(" ")
        .trim();

      setContent(renderDictationIntoContent(combinedTranscript));
    };

    recognition.onerror = (event?: SpeechRecognitionErrorLike) => {
      if (event?.error === "not-allowed") {
        showMessage("Microphone access is blocked in this browser");
      } else if (event?.error === "no-speech") {
        showMessage("No speech was detected. Try again and speak a little closer.");
      }
      setContent(dictationBaseContentRef.current);
      recognitionRef.current = null;
      setIsDictating(false);
    };

    recognition.onend = () => {
      commitDictation();
      recognitionRef.current = null;
      setIsDictating(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    dictationBaseContentRef.current = content;
    dictationBufferRef.current = "";
    setIsDictating(true);
  };

  const handleEditorClose = () => {
    const hasPartialDraft = Boolean(
      selectedClass || title.trim() || content.trim() || references.trim() || tags.length
    );

    const existingReminders = JSON.parse(localStorage.getItem("reminders") || "[]");

    const followUpReminderAt = getFollowUpReminderDate(
      followUpReminderOption,
      followUpReminderCustomAt
    );

    if (enableFollowUpReminder && followUpReminderOption === "custom" && !followUpReminderAt) {
      showMessage("Pick a custom follow-up time before closing this lesson");
      return;
    }

    if (enableFollowUpReminder && followUpReminderAt && hasPartialDraft) {
      const reminderId = draftReminderId ?? Date.now();
      const draftReminder = {
        id: reminderId,
        title: title.trim() || "Finish lesson plan",
        className: selectedClass || "Unassigned lesson",
        lessonDate: date || "",
        classTime: lessonTime || "",
        remindAt: followUpReminderAt.toISOString(),
        type: "draft",
      };

      localStorage.setItem(
        "reminders",
        JSON.stringify([
          draftReminder,
          ...existingReminders.filter((reminder: any) => reminder.id !== reminderId),
        ])
      );
      setDraftReminderId(reminderId);
      showMessage("Reminder saved for this unfinished lesson");
    } else if (draftReminderId) {
      localStorage.setItem(
        "reminders",
        JSON.stringify(existingReminders.filter((reminder: any) => reminder.id !== draftReminderId))
      );
    }

    setIsEditor(false);
  };

  const handleSave = () => {
    if (!title.trim() || !date || !lessonTime) {
      showMessage("Title, date, and time are required");
      return;
    }

    const mergedTags = Array.from(new Set([...tags, ...aiSuggestedTags]));
const classTime = lessonTime || getClassTime(selectedClass);
    const payload: Log = {
  id: editingId ?? Date.now(),
  className: selectedClass || "Unassigned",
 classTime,
  title: title.trim(),
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
    if (selectedClass) {
      localStorage.setItem("lastUsedClass", selectedClass);
    }

    const remindersEnabled = getStoredRemindersEnabled();
    const existing = JSON.parse(localStorage.getItem("reminders") || "[]");
    const withoutDraftReminder = existing.filter((reminder: any) => reminder.id !== draftReminderId);

    if (remindersEnabled && enablePrepReminder) {
      const fullDateTime = date && classTime
        ? new Date(`${date}T${classTime}:00`)
        : new Date();

      if (isNaN(fullDateTime.getTime())) {
        showMessage("Invalid class date/time");
        return;
      }

      const reminderTime = calculateReminderTime(
        fullDateTime.toISOString(),
        prepReminderTime
      );

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
        JSON.stringify([
          newReminder,
          ...withoutDraftReminder.filter((reminder: any) => reminder.logId !== payload.id),
        ])
      );
    } else {
      localStorage.setItem(
        "reminders",
        JSON.stringify(withoutDraftReminder.filter((reminder: any) => reminder.logId !== payload.id))
      );
    }

    setIsEditor(false);
    setDraftReminderId(null);
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
    border: "1px solid var(--border)",
    background: "var(--text)",
    color: "var(--bg)",
    cursor: "pointer",
    fontWeight: 500,
  };

  const whiteBtn: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text)",
    cursor: "pointer",
    fontWeight: 500,
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--surface-soft)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
  
    padding: 14,
    borderRadius: 14,
    border: "1px solid var(--border)",
  
    boxShadow: "var(--shadow-soft)",
  
    transition: "all 0.2s ease",
    color: "var(--text)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "var(--input-bg)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    fontSize: "14px",
    fontFamily: "inherit", // ✅ THIS is the key fix
    outline: "none",
    transition: "all 0.2s ease",
    color: "var(--text)",
  };

  const tagStyle: React.CSSProperties = {
    display: "inline-block",
    background: "var(--tag-surface)",
    padding: "4px 8px",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
    color: "var(--tag-text)",
    border: "1px solid var(--info-soft-border)",
  };

  const activeTagStyle: React.CSSProperties = {
    ...tagStyle,
    background: "var(--bubble-blue-bg)",
    border: "1px solid var(--bubble-blue-border)",
    color: "var(--bubble-blue-text)",
  };

  const shellStyle: React.CSSProperties = {
    padding: 20,
    background: "var(--bg)",
    minHeight: "100%",
    color: "var(--text)",
    fontFamily: "inherit",
    maxWidth: 620,
    margin: "0 auto",
  };

  const filterPanelTitle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: 10,
  };

  const metaRowStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    fontSize: 12.5,
    color: "var(--muted)",
    lineHeight: 1.4,
  };

  const metaDotStyle: React.CSSProperties = {
    opacity: 0.6,
  };

  const listEmptyStyle: React.CSSProperties = {
    ...cardStyle,
    cursor: "default",
  };

  const editorHeaderStyle: React.CSSProperties = {
    paddingLeft: 14,
    borderLeft: "4px solid rgba(37, 99, 235, 0.82)",
    boxShadow: "inset 1px 0 0 rgba(255,255,255,0.18)",
    marginBottom: 16,
  };

  const editorMetaGrid: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  };

  const editorClassField: React.CSSProperties = {
    ...inputStyle,
    flex: "1 1 220px",
    minWidth: 0,
  };

  const editorDateField: React.CSSProperties = {
    ...inputStyle,
    flex: "1 1 140px",
    minWidth: 0,
    appearance: "none",
    WebkitAppearance: "none",
    minHeight: 48,
  };

  const editorTimeField: React.CSSProperties = {
    ...inputStyle,
    flex: "1 1 120px",
    minWidth: 0,
    appearance: "none",
    WebkitAppearance: "none",
    minHeight: 48,
  };

  const editorSectionLabel: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: 8,
  };

  const reminderCardStyle: React.CSSProperties = {
    ...cardStyle,
    background: "var(--premium-panel-strong)",
    border: "1px solid rgba(59,130,246,0.14)",
    borderRadius: 18,
    boxShadow: "0 16px 34px rgba(37,99,235,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
  };

  const reminderToggleStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  };

  const reminderPreview = (() => {
    if (!date || !lessonTime) return "";

    const reminderAt = calculateReminderTime(
      new Date(`${date}T${lessonTime}:00`).toISOString(),
      prepReminderTime
    );

    if (isNaN(reminderAt.getTime())) return "";

    return reminderAt.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  })();

  const fieldGroupStyle: React.CSSProperties = {
    display: "grid",
    gap: 6,
    flex: "1 1 140px",
    minWidth: 0,
  };

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--muted)",
  };

  const pickerWrapStyle: React.CSSProperties = {
    position: "relative",
  };

  const pickerIconStyle: React.CSSProperties = {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 14,
    color: "var(--muted)",
    pointerEvents: "none",
  };

  const textAreaWrapStyle: React.CSSProperties = {
    position: "relative",
  };

  const lessonPlanPanelStyle: React.CSSProperties = {
    background: "var(--premium-panel-strong)",
    border: "1px solid rgba(148,163,184,0.16)",
    borderRadius: 22,
    padding: 16,
    boxShadow: "0 18px 34px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.42)",
    display: "grid",
    gap: 12,
  };

  const lessonPlanHeaderStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  };

  const lessonPlanHintStyle: React.CSSProperties = {
    fontSize: 13,
    lineHeight: 1.5,
    color: isDictating ? "var(--bubble-blue-text)" : "var(--muted)",
    background: isDictating ? "var(--bubble-blue-bg)" : "rgba(255,255,255,0.46)",
    border: isDictating
      ? "1px solid var(--bubble-blue-border)"
      : "1px solid rgba(148,163,184,0.14)",
    borderRadius: 14,
    padding: "10px 12px",
    maxWidth: 320,
    boxShadow: isDictating ? "0 10px 18px rgba(37,99,235,0.1)" : "none",
  };

  const lessonPlanTextAreaStyle: React.CSSProperties = {
    minHeight: "40vh",
    resize: "vertical",
    paddingBottom: 64,
    border: "none",
    background: "transparent",
    boxShadow: "none",
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
  };

  const micButtonStyle: React.CSSProperties = {
    position: "absolute",
    right: 14,
    bottom: 14,
    minWidth: 124,
    height: 48,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.24)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 10px 18px rgba(15,23,42,0.24)",
  };

  const dictationIndicatorStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 4px)",
    alignItems: "end",
    gap: 3,
    height: 16,
  };

  const reminderPreviewStyle: React.CSSProperties = {
    fontSize: 13,
    color: "var(--muted)",
    padding: "10px 12px",
    borderRadius: 10,
    background: "var(--info-soft)",
    border: "1px solid var(--info-soft-border)",
  };

  const reminderDividerStyle: React.CSSProperties = {
    height: 1,
    background: "rgba(148,163,184,0.16)",
  };

  const followUpReminderPreview = (() => {
    const reminderAt = getFollowUpReminderDate(
      followUpReminderOption,
      followUpReminderCustomAt
    );

    if (!reminderAt) return "";

    return reminderAt.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  })();

  if (isEditor) {
    return (
      <div style={shellStyle}>
        <Toast />
        <div style={{ maxWidth: "100%", margin: "0 auto", padding: isMobile ? "8px 0 16px" : "16px" }}>
            <div
              style={{
                background:
                  "var(--premium-panel)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                borderRadius: "24px",
                padding: isMobile ? "18px" : "24px",
                border: "1px solid rgba(148,163,184,0.18)",
                boxShadow:
                  "0 24px 50px rgba(15,23,42,0.1), 0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
            <div style={{ marginBottom: 14, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleEditorClose} style={whiteBtn}>
                ← Back
              </button>
            </div>

            <div style={editorHeaderStyle}>
              <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
                {editingId !== null ? "Edit Lesson" : "New Lesson"}
              </h1>
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                marginTop: 8,
                lineHeight: 1.65,
                maxWidth: 420,
                color: "var(--muted)",
              }}
            >
                Turn your ideas into lessons you can run with confidence.
              </div>
            </div>
  
            <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
              <div>
                <div style={editorSectionLabel}>Lesson Details</div>
                <div style={editorMetaGrid}>
                  <div style={{ ...fieldGroupStyle, flex: "1.3 1 220px" }}>
                    <label style={fieldLabelStyle}>Class</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => {
                        const nextClass = e.target.value;
                        setSelectedClass(nextClass);
                        setLessonTime(getClassTime(nextClass));
                      }}
                      style={editorClassField}
                    >
                      <option value="">Select class</option>
                      {classes.map((c, i) => (
                        <option key={`${c.name}-${i}`} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={fieldGroupStyle}>
                    <label style={fieldLabelStyle}>Date</label>
                    <div style={pickerWrapStyle}>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={editorDateField}
                      />
                      <span style={pickerIconStyle}>📅</span>
                    </div>
                  </div>

                  <div style={fieldGroupStyle}>
                    <label style={fieldLabelStyle}>Time</label>
                    <div style={pickerWrapStyle}>
                      <input
                        type="time"
                        value={lessonTime}
                        onChange={(e) => setLessonTime(e.target.value)}
                        style={editorTimeField}
                      />
                      <span style={pickerIconStyle}>🕒</span>
                    </div>
                  </div>
                </div>
              </div>
  
              <input
                placeholder="Lesson title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />

              <div style={lessonPlanPanelStyle}>
                <div style={lessonPlanHeaderStyle}>
                  <div>
                    <div style={{ ...editorSectionLabel, marginBottom: 6 }}>Lesson Plan</div>
                    <div style={lessonPlanHintStyle}>
                      {isDictating
                        ? "Listening now. Speak naturally, then tap Stop when you're ready to finish."
                        : "Write here or tap Speak to dictate directly into your lesson plan. Tap Stop when you're done."}
                    </div>
                  </div>
                </div>

                <div style={textAreaWrapStyle}>
                  <textarea
                    placeholder="Lesson plan"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ ...inputStyle, ...lessonPlanTextAreaStyle }}
                  />
                  <button
                    aria-label={isDictating ? "Stop voice dictation" : "Start voice dictation"}
                    onClick={handleDictationToggle}
                    style={{
                      ...micButtonStyle,
                      background: isDictating
                        ? "linear-gradient(135deg, rgba(14,165,233,0.96), rgba(37,99,235,0.96))"
                        : "rgba(15, 23, 42, 0.86)",
                      border: isDictating
                        ? "1px solid rgba(191,219,254,0.7)"
                        : "1px solid rgba(148,163,184,0.24)",
                      boxShadow: isDictating
                        ? "0 14px 24px rgba(37,99,235,0.3)"
                        : micButtonStyle.boxShadow,
                    }}
                    type="button"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      style={{ width: 18, height: 18 }}
                    >
                      <path
                        d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zm5 9a5 5 0 01-10 0H5a7 7 0 0014 0zm-4 8h-2v-3.08A7.03 7.03 0 0112 17a7.03 7.03 0 011 .92z"
                        fill="currentColor"
                      />
                    </svg>
                    <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.01em" }}>
                      {isDictating ? "Stop" : "Speak"}
                    </span>
                    {isDictating && (
                      <span aria-hidden="true" style={dictationIndicatorStyle}>
                        {[0, 1, 2].map((bar) => (
                          <span
                            key={bar}
                            style={{
                              width: 4,
                              borderRadius: 999,
                              background: "rgba(255,255,255,0.95)",
                              animation: `dictationPulse 0.9s ${bar * 0.14}s ease-in-out infinite`,
                              height: `${10 + bar * 3}px`,
                            }}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div style={reminderCardStyle}>
                <div style={{ ...editorSectionLabel, marginBottom: 10 }}>Smart Reminders</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: "var(--text)" }}>
                  Stay prepared before class and finish what's left after.
                </div>
                <div style={reminderToggleStyle}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Before Class Reminder</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.45 }}>
                      Get a heads-up before class starts.
                    </div>
                  </div>
                  <button
                    onClick={() => setEnablePrepReminder((current) => !current)}
                    style={{
                      ...whiteBtn,
                      minWidth: 78,
                      borderRadius: 999,
                      border: enablePrepReminder
                        ? "1px solid rgba(59,130,246,0.22)"
                        : "1px solid var(--border-strong)",
                      background: enablePrepReminder
                        ? "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(96,165,250,0.2))"
                        : "rgba(255,255,255,0.82)",
                      boxShadow: enablePrepReminder
                        ? "0 8px 18px rgba(37,99,235,0.12)"
                        : "none",
                    }}
                  >
                    {enablePrepReminder ? "On" : "Off"}
                  </button>
                </div>

                {enablePrepReminder && (
                  <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                    <select
                      value={prepReminderTime}
                      onChange={(e) => setPrepReminderTime(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="30m">30 minutes before</option>
                      <option value="1h">1 hour before</option>
                      <option value="2h">2 hours before</option>
                      <option value="12h">12 hours before</option>
                      <option value="1d">1 day before</option>
                      <option value="2d">2 days before</option>
                      <option value="1w">1 week before</option>
                    </select>

                    {reminderPreview && (
                      <div style={reminderPreviewStyle}>
                        Reminder will fire around {reminderPreview}.
                      </div>
                    )}
                  </div>
                )}

                <div style={{ ...reminderDividerStyle, marginTop: 12 }} />

                <div style={reminderToggleStyle}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Follow-Up Reminder</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.45 }}>
                      Get reminded if this lesson still needs work.
                    </div>
                  </div>
                  <button
                    onClick={() => setEnableFollowUpReminder((current) => !current)}
                    style={{
                      ...whiteBtn,
                      minWidth: 78,
                      borderRadius: 999,
                      border: enableFollowUpReminder
                        ? "1px solid rgba(59,130,246,0.22)"
                        : "1px solid var(--border-strong)",
                      background: enableFollowUpReminder
                        ? "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(96,165,250,0.2))"
                        : "rgba(255,255,255,0.82)",
                      boxShadow: enableFollowUpReminder
                        ? "0 8px 18px rgba(37,99,235,0.12)"
                        : "none",
                    }}
                  >
                    {enableFollowUpReminder ? "On" : "Off"}
                  </button>
                </div>

                {enableFollowUpReminder && (
                  <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                    <select
                      value={followUpReminderOption}
                      onChange={(e) => setFollowUpReminderOption(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="later_today">Later today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="custom">Custom</option>
                    </select>

                    {followUpReminderOption === "custom" && (
                      <input
                        type="datetime-local"
                        value={followUpReminderCustomAt}
                        onChange={(e) => setFollowUpReminderCustomAt(e.target.value)}
                        style={inputStyle}
                      />
                    )}

                    <div style={reminderPreviewStyle}>
                      {followUpReminderPreview
                        ? `We'll remind you around ${followUpReminderPreview}.`
                        : "Pick a custom time for your follow-up reminder."}
                    </div>
                  </div>
                )}
              </div>
  
              <div style={{ ...cardStyle, background: "var(--ghost-bg)" }}>
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
                          style={{ ...tagStyle, background: "rgba(59,130,246,0.24)", color: "#dbeafe" }}
                        >
                          + {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
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
                        color: "var(--text)",
                      }}
                    >
                      {aiTips.map((tip, i) => (
                        <div key={i}>• {tip}</div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
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
                        color: "var(--text)",
                      }}
                    >
                      {relatedLessons.map((log) => (
                        <div key={log.id}>
                          {log.title} · {log.className} · {log.date}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
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
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
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
      <style jsx global>{`
        @keyframes dictationPulse {
          0%,
          100% {
            transform: scaleY(0.55);
            opacity: 0.68;
          }
          50% {
            transform: scaleY(1.1);
            opacity: 1;
          }
        }
      `}</style>
  
      <div
        style={{
          padding: "0 0 0 14px",
          borderLeft: "4px solid rgba(37, 99, 235, 0.82)",
          boxShadow: "inset 1px 0 0 rgba(255,255,255,0.18)",
          marginBottom: 14,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 0, color: "var(--page-title)", textShadow: "0 1px 0 rgba(255,255,255,0.12)" }}>Logs</h1>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            marginTop: 8,
            lineHeight: 1.45,
            color: "var(--page-subtitle)",
          }}
        >
          Turn your ideas into lessons you can run with confidence.
        </div>
      </div>
  
      <button
        onClick={handleNewLesson}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "14px",
          border: "none",
          background: "linear-gradient(135deg, #1e3a8a, #2563eb, #60a5fa)",
          color: "white",
          fontWeight: 600,
          fontSize: "15px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          marginBottom: 16,
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
  
      <div
        style={{
          ...cardStyle,
          marginBottom: 16,
          padding: 16,
        }}
      >
        <div style={filterPanelTitle}>Filter Lessons</div>
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
              e.currentTarget.style.border = "1px solid var(--border)";
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
        {filteredLogs.length === 0 && (
          <div style={listEmptyStyle}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              No matching lessons
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
              Try changing your filters, or create a new lesson to start building your archive.
            </div>
          </div>
        )}

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
              e.currentTarget.style.background = "var(--surface)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "var(--shadow-soft)";
              e.currentTarget.style.background = "var(--surface-soft)";
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
              {log.title}
            </div>
  
            <div style={metaRowStyle}>
              <span>{log.className}</span>
              <span style={metaDotStyle}>•</span>
              <span>{formatLessonDate(log.date)}</span>
              <span style={metaDotStyle}>•</span>
              <span>{formatTime(log.classTime || getClassTime(log.className))}</span>
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
