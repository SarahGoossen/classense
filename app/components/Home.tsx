"use client";

import { useEffect, useState } from "react";
const getUserName = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("app_name") || "";
};
const formatTime = (t?: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const formatDate = (d?: string) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  const localDate = new Date(Number(y), Number(m) - 1, Number(day));
  return localDate.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
type Log = {
  id: number;
  className: string;
  title: string;
  date: string;
  classTime?: string;
};

type ClassItem = {
  id: number;
  name: string;
  day?: string;
  time?: string;
};
type ReminderItem = {
  id: number;
  title: string;
  className: string;
  remindAt: string;
};

type LibraryItem = {
  id?: number;
};

const formatReminderDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function Home({ setTab }: any) {
  const userName = getUserName();
  const [logs, setLogs] = useState<Log[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);

  // 🔥 CENTRALIZED LOADER
  const loadData = () => {
    const savedLogs = localStorage.getItem("logs");
    const savedClasses = localStorage.getItem("classes");
    const savedReminders = localStorage.getItem("reminders");
    const savedLibrary = localStorage.getItem("library");

    setLogs(savedLogs ? JSON.parse(savedLogs) : []);
    setClasses(savedClasses ? JSON.parse(savedClasses) : []);
    setReminders(savedReminders ? JSON.parse(savedReminders) : []);
    setLibraryItems(savedLibrary ? JSON.parse(savedLibrary) : []);
  };

  useEffect(() => {
    loadData();

    // 🔥 FIX 1: refresh when user returns to tab
    const onFocus = () => loadData();
    window.addEventListener("focus", onFocus);

    // 🔥 FIX 2: refresh when logs/classes change (live sync)
    const onStorage = () => loadData();
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const getNextClassDate = (dayName?: string, time?: string) => {
    if (!dayName) return null;

    const daysMap: any = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const targetDay = daysMap[dayName];
    if (targetDay === undefined) return null;

    const now = new Date();
    const next = new Date();
    next.setHours(0, 0, 0, 0);

    let diff = targetDay - now.getDay();
    if (diff < 0) diff += 7;

    next.setDate(now.getDate() + diff);

    if (time && time.includes(":")) {
      const [h, m] = time.split(":");
      next.setHours(parseInt(h) || 0);
      next.setMinutes(parseInt(m) || 0);
      next.setSeconds(0);
    } else {
      next.setHours(0, 0, 0, 0);
    }

    if (next < now) {
      next.setHours(23, 59, 59, 999);

      if (next < now) {
        next.setDate(next.getDate() + 7);
      }
    }

    return next;
  };

const recentLogs = [...logs]
.sort((a, b) => (a.date < b.date ? 1 : -1))
.slice(0, 3);

const upcomingReminders = [...reminders]
.filter((reminder) => reminder.remindAt && new Date(reminder.remindAt).getTime() >= Date.now())
.sort((a, b) => (a.remindAt > b.remindAt ? 1 : -1))
.slice(0, 2);

const nextReminder = upcomingReminders[0];

const libraryCount = libraryItems.length;

return (
<div className="page">
  <div className="bg-glow" />

  <div className="content">
    <div className="hero-panel">
      <div className="header">
        <div className="title">Dashboard</div>

        <div
        style={{
          fontSize: 17,
          fontWeight: 600,
          marginTop: 8,
          marginBottom: 8,
          lineHeight: 1.35,
          color: "var(--text)",
        }}
      >
          {userName
            ? `Welcome back, ${userName}. Run your classes like a pro. No chaos, no guesswork.`
            : "Run your classes like a pro. No chaos, no guesswork."}
        </div>

        <div className="subtitle">Everything in one place-lessons, classes, notes, and reminders-so you can focus on teaching, not chasing details.</div>
      </div>

      <div className="actions">
        <button onClick={() => setTab("classes")} className="lux-btn action-card">
          <span className="action-kicker">Step 1</span>
          <span className="action-title">Add Class</span>
          <span className="action-copy">
            Set up your classes once. Everything else flows from here.
          </span>
        </button>

        <button onClick={() => setTab("logs")} className="lux-btn action-card">
          <span className="action-kicker">Step 2</span>
          <span className="action-title">Add Lesson</span>
          <span className="action-copy">
            Capture your ideas, plans, and notes. Reuse what works. Improve what doesn't.
          </span>
        </button>
      </div>

      <div className="stats">
        <button
          className="stat stat-clickable"
          onClick={() => {
            localStorage.removeItem("openNewLesson");
            setTab("logs");
          }}
        >
          <div>{logs.length}</div>
          <span>Lesson Plans</span>
          <small>Your playbook-ready when you are.</small>
        </button>

        <button className="stat stat-clickable" onClick={() => setTab("classes")}>
          <div>{classes.length}</div>
          <span>Classes</span>
          <small>See your schedule. Stay in control.</small>
        </button>

        <button className="stat stat-clickable" onClick={() => setTab("library")}>
          <div>{libraryCount}</div>
          <span>Library</span>
          <small>Your go-to vault for teaching gold.</small>
        </button>

        {upcomingReminders.length === 0 && (
          <button
            className="stat stat-clickable hero-reminder-card"
            onClick={() => {
              localStorage.setItem("openPlannerSection", "scheduled");
              setTab("planner");
            }}
          >
            <div>0</div>
          <span>Reminders</span>
            <small>Never miss a beat again.</small>
          </button>
        )}

        {nextReminder && (
          <button
            className="stat stat-clickable hero-reminder-card"
            onClick={() => {
              localStorage.setItem("openPlannerSection", "scheduled");
              setTab("planner");
            }}
          >
            <div>{upcomingReminders.length}</div>
            <span>Reminders</span>
            <small>{nextReminder.title} • {formatReminderDate(nextReminder.remindAt)}</small>
          </button>
        )}
      </div>
    </div>

    <div>
      <div
        className="card empty-card friendly-card"
        onClick={() => {
          localStorage.setItem("openNewLesson", "true");
          setTab("logs");
        }}
      >
        <div className="card-title">Lesson Plan Check-In</div>
        <small>
          Stay one step ahead of your class. Your next lesson should already be in motion. Add it now while the ideas are still hot.
        </small>
      </div>
    </div>

    <div>
      <div className="section-head">
        <div className="section-title">Latest Lesson Plans</div>
        <div className="section-copy">
          Your recent work, front and center. Jump back into what you've created, or head to Logs for the full history. Need resources? Your Library's got your back.
        </div>
      </div>

      {recentLogs.length === 0 && (
        <div className="card empty-card">
          <div className="card-title">No lesson plans yet</div>
          <small>Add a class, then save your first lesson plan. Use Library for reusable links, notes, and teaching resources.</small>
        </div>
      )}

      {recentLogs.map((log) => (
        <div
          key={log.id}
          className="card"
          onClick={() => {
            localStorage.setItem("openLogId", log.id.toString());
            setTab("logs");
          }}
        >
          <div className="card-title">{log.title}</div>
          <small>
            {log.className} • {formatDate(log.date)} {" • "}
            {log.classTime
              ? new Date(`1970-01-01 ${log.classTime}`).toLocaleTimeString(
                  "en-US",
                  {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }
                )
              : ""}
          </small>
        </div>
      ))}

      {libraryCount > 0 && (
        <div
          className="card empty-card friendly-card"
          onClick={() => setTab("library")}
        >
          <div className="card-title">Need your saved resources too?</div>
          <small>Library has {libraryCount} saved item{libraryCount === 1 ? "" : "s"} ready to open.</small>
        </div>
      )}
    </div>
  </div>

  <style jsx>{`
    .page {
      position: relative;
      min-height: 100%;
      padding: 20px;
      background: var(--bg);
      color: var(--text);
      overflow: hidden;
      transition: background 0.25s ease, color 0.25s ease;
    }

    .bg-glow {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(
        circle,
        rgba(37, 99, 235, 0.15),
        transparent
      );
      top: -150px;
      right: -150px;
      filter: blur(100px);
      animation: float 8s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(20px);
      }
    }

    .content {
      position: relative;
      z-index: 2;
      max-width: 760px;
      margin: 0 auto;
    }

    .title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--text);
      margin-bottom: 6px;
      opacity: 0.7;
    }

    .subtitle {
      font-size: 15px;
      color: rgba(15, 23, 42, 0.72);
      margin-top: 4px;
      line-height: 1.6;
      max-width: 52ch;
    }

    .header {
      margin-bottom: 22px;
    }

    .hero-panel {
      background: linear-gradient(
        145deg,
        rgba(246, 248, 252, 0.98) 0%,
        rgba(255, 255, 255, 0.96) 34%,
        rgba(232, 237, 245, 0.98) 68%,
        rgba(242, 246, 251, 0.98) 100%
      );
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 30px;
      padding: 24px;
      margin-bottom: 28px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.65),
        inset 0 -1px 0 rgba(148, 163, 184, 0.12),
        0 24px 60px rgba(15, 23, 42, 0.1);
    }

    :global(.dark) .hero-panel {
      background: linear-gradient(
        145deg,
        rgba(83, 66, 120, 0.94) 0%,
        rgba(68, 57, 101, 0.92) 40%,
        rgba(54, 60, 102, 0.92) 72%,
        rgba(74, 63, 108, 0.94) 100%
      );
      border: 1px solid rgba(196, 181, 253, 0.22);
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.08),
        inset 0 -1px 0 rgba(15, 23, 42, 0.2),
        var(--shadow-soft);
    }

    :global(.dark) .subtitle {
      color: rgba(226, 232, 240, 0.82);
    }

    .actions {
      display: flex;
      gap: 16px;
      margin-bottom: 18px;
    }

    .lux-btn {
      flex: 1;
      padding: 14px 16px;
      border-radius: 16px;
      border: none;
      color: white;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      background: linear-gradient(
        135deg,
        #1e3a8a,
        #2563eb,
        #60a5fa,
        #2563eb,
        #1e3a8a
      );
      background-size: 200% 200%;
      box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.3),
        0 10px 25px rgba(37, 99, 235, 0.35);
      transition: all 0.25s ease;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      gap: 6px;
      min-height: 108px;
      text-align: left;
      position: relative;
      overflow: hidden;
    }

    .action-kicker {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.72);
    }

    .action-title {
      font-size: 18px;
      line-height: 1.15;
      font-weight: 700;
      color: #fff;
    }

    .action-copy {
      font-size: 12px;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.8);
      max-width: 24ch;
    }

    .action-card::after {
      content: "";
      position: absolute;
      inset: auto -18% -38% auto;
      width: 110px;
      height: 110px;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.22), transparent 70%);
      pointer-events: none;
    }

    .lux-btn:hover {
      transform: translateY(-3px);
      background-position: 100% 50%;
    }

    .stats {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
      align-items: stretch;
    }

    .stat {
      flex: 1;
      padding: 12px;
      border-radius: 14px;
      text-align: left;
      min-height: 84px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: white;
      background: linear-gradient(135deg, #24473c, #2f5a4d, #446f61);
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.18),
        0 6px 14px rgba(21, 45, 36, 0.2);
      border: none;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }

    .stat::after {
      content: "";
      position: absolute;
      right: -18px;
      bottom: -22px;
      width: 88px;
      height: 88px;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.14), transparent 68%);
      pointer-events: none;
    }

    .stat:nth-child(2) {
      background: linear-gradient(135deg, #234f62, #2d6b84, #3f8097);
    }

    .stat:nth-child(3) {
      background: linear-gradient(135deg, #5a3f1d, #7d5a2a, #9d7640);
    }

    .stat div {
      font-size: 22px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat span {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
    }

    .stat small {
      display: block;
      margin-top: 6px;
      color: rgba(255, 255, 255, 0.75);
      font-size: 11px;
      line-height: 1.35;
      min-height: 28px;
    }

    .stat-clickable {
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-clickable:hover {
      transform: translateY(-2px);
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.18),
        0 10px 20px rgba(21, 45, 36, 0.24);
    }

    .hero-reminder-card {
      margin-bottom: 0;
    }

    .section-head {
      margin-bottom: 14px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 650;
      margin-bottom: 4px;
      color: var(--text);
      letter-spacing: -0.02em;
    }

    .section-copy {
      font-size: 13px;
      line-height: 1.6;
      color: var(--muted);
      max-width: 58ch;
    }

    small {
      color: var(--muted);
    }

    .card {
      background: var(--surface-soft);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);

      border-radius: 18px;
      padding: 16px 18px;
      margin-bottom: 14px;

      border: 1px solid var(--border);

      box-shadow: var(--shadow-soft);

      transition: all 0.2s ease;
      cursor: pointer;
    }

    .card-title {
      font-size: 16px;
      font-weight: 650;
      color: var(--text);
      margin-bottom: 4px;
      letter-spacing: -0.2px;
    }

    .card-sub {
      font-size: 12.5px;
      color: var(--muted);
      line-height: 1.4;
    }

    .card:hover {
      transform: translateY(-4px) scale(1.01);
      box-shadow: var(--shadow-strong);
      background: var(--surface);
    }

    .friendly-card {
      cursor: pointer;
      border-left: 4px solid #60a5fa;
      background: linear-gradient(135deg, rgba(96, 165, 250, 0.08), rgba(255, 255, 255, 0.92));
    }

    .empty-card {
      cursor: default;
    }

    .empty-card:hover {
      transform: none;
      box-shadow: var(--shadow-soft);
      background: var(--surface-soft);
    }

    @media (max-width: 640px) {
      .page {
        padding: 16px;
      }

      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .action-card {
        min-height: 92px;
        padding: 12px 14px;
      }

      .action-title {
        font-size: 16px;
      }

      .action-copy {
        font-size: 11px;
      }

      .stat {
        min-height: 72px;
        padding: 10px;
      }

      .stat div {
        font-size: 18px;
      }

      .stat span {
        font-size: 11px;
      }

      .stat small {
        font-size: 10px;
        min-height: 24px;
      }

      .hero-panel {
        padding: 18px;
      }
    }
  `}</style>
</div>
);
}
