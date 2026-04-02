"use client";

import { useEffect, useState } from "react";
const getUserName = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("app_name") || "";
};
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  // 🔥 CENTRALIZED LOADER
  const loadData = () => {
    const savedLogs = localStorage.getItem("logs");
    const savedClasses = localStorage.getItem("classes");
    const savedReminders = localStorage.getItem("reminders");

    setLogs(savedLogs ? JSON.parse(savedLogs) : []);
    setClasses(savedClasses ? JSON.parse(savedClasses) : []);
    setReminders(savedReminders ? JSON.parse(savedReminders) : []);
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

 // 🔥 YOUR ORIGINAL LOGIC (FIXED CLEAN)
const upcomingPrep = classes
.filter((c) => {
  const hasLog = logs.some((l) => l.className === c.name);
  return !hasLog;
})
.map((c) => {
  const rawNextDate = getNextClassDate(c.day, c.time);

  if (!rawNextDate) {
    return {
      ...c,
      nextDate: null,
      displayTime: c.time,
    };
  }

  const matchingLog = logs.find((l) => {
    return l.className === c.name;
  });

  return {
    ...c,
    nextDate: rawNextDate,
    displayTime: matchingLog?.classTime || c.time,
  };
});

const recentLogs = [...logs]
.sort((a, b) => (a.date < b.date ? 1 : -1))
.slice(0, 5);

const upcomingReminders = [...reminders]
.filter((reminder) => reminder.remindAt && new Date(reminder.remindAt).getTime() >= Date.now())
.sort((a, b) => (a.remindAt > b.remindAt ? 1 : -1))
.slice(0, 2);

const nextReminder = upcomingReminders[0];

const thisWeekCount = logs.length;

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
            ? `Welcome back, ${userName}. Your teaching command center is ready.`
            : "Welcome. Your teaching command center is ready."}
        </div>

        <div className="subtitle">Stay on top of your lessons</div>
      </div>

      <div className="actions">
        <button onClick={() => setTab("classes")} className="lux-btn action-card">
          <span className="action-kicker">Step 1</span>
          <span className="action-title">Add Class</span>
          <span className="action-copy">
            Start by creating your classes so lessons can be linked correctly.
          </span>
        </button>

        <button onClick={() => setTab("logs")} className="lux-btn action-card">
          <span className="action-kicker">Step 2</span>
          <span className="action-title">Add Lesson</span>
          <span className="action-copy">
            Save lesson plans and teaching notes after your classes are set up.
          </span>
        </button>
      </div>

      <div className="stats">
        <button className="stat stat-clickable" onClick={() => setTab("logs")}>
          <div>{logs.length}</div>
          <span>Logs</span>
          <small>Open lessons</small>
        </button>

        <button className="stat stat-clickable" onClick={() => setTab("classes")}>
          <div>{classes.length}</div>
          <span>Classes</span>
          <small>Manage classes</small>
        </button>

        <div className="stat">
          <div>{thisWeekCount}</div>
          <span>Week</span>
          <small>Lessons saved</small>
        </div>

        {upcomingReminders.length === 0 && (
          <button
            className="stat stat-clickable hero-reminder-card"
            onClick={() => setTab("planner")}
          >
            <div>0</div>
            <span>Upcoming Reminders</span>
            <small>Save a lesson with reminders on and it will appear here.</small>
          </button>
        )}

        {nextReminder && (
          <button
            className="stat stat-clickable hero-reminder-card"
            onClick={() => setTab("planner")}
          >
            <div>{upcomingReminders.length}</div>
            <span>Upcoming Reminders</span>
            <small>{nextReminder.title} • {formatReminderDate(nextReminder.remindAt)}</small>
          </button>
        )}
      </div>
    </div>

    <div>
      <div className="section-head">
        <div className="section-title">Prep Needed</div>
        <div className="section-copy">
          Classes without a saved lesson will show up here.
        </div>
      </div>

      {upcomingPrep.length === 0 && (
        <div className="card empty-card">
          <div className="card-title">All classes prepared</div>
          <small>No prep gaps right now. New classes will appear here until a lesson is saved.</small>
        </div>
      )}

      {upcomingPrep.map((c, i) => (
        <div
          key={i}
          className="card prep"
          onClick={() => {
            localStorage.setItem("lastUsedClass", c.name);
            setTab("logs");
          }}
        >
          <div className="card-title">⚠️ {c.name}</div>
          <small>
            {typeof c.day === "number" ? dayNames[c.day] : c.day} •{" "}
            {formatTime(c.displayTime)}
          </small>
        </div>
      ))}
    </div>

    <div>
      <div className="section-head">
        <div className="section-title">Recent Lessons</div>
        <div className="section-copy">
          Your latest lesson plans and teaching notes live here.
        </div>
      </div>

      {recentLogs.length === 0 && (
        <div className="card empty-card">
          <div className="card-title">No lessons yet</div>
          <small>Create your first lesson after adding a class to start building your library.</small>
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
    }

    .title {
      font-size: 24px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 0;
    }

    .subtitle {
      font-size: 14px;
      color: rgba(15, 23, 42, 0.74);
      margin-top: 2px;
      line-height: 1.45;
    }

    .header {
      margin-bottom: 18px;
    }

    .hero-panel {
      background: linear-gradient(
        145deg,
        rgba(233, 237, 243, 0.98) 0%,
        rgba(249, 250, 252, 0.97) 34%,
        rgba(215, 221, 231, 0.98) 68%,
        rgba(240, 243, 248, 0.98) 100%
      );
      border: 1px solid rgba(148, 163, 184, 0.34);
      border-radius: 24px;
      padding: 18px;
      margin-bottom: 24px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.5),
        inset 0 -1px 0 rgba(148, 163, 184, 0.16),
        var(--shadow-soft);
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
      margin-bottom: 16px;
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

    .lux-btn:hover {
      transform: translateY(-3px);
      background-position: 100% 50%;
    }

    .stats {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
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
      background: linear-gradient(135deg, #27483b, #335a4c, #456e5f);
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.18),
        0 6px 14px rgba(21, 45, 36, 0.2);
      border: none;
      box-sizing: border-box;
    }

    .stat div {
      font-size: 20px;
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
      margin-bottom: 10px;
    }

    .section-title {
      font-weight: 500;
      margin-bottom: 2px;
      color: var(--text);
    }

    .section-copy {
      font-size: 12px;
      line-height: 1.45;
      color: var(--muted);
    }

    small {
      color: var(--muted);
    }

    .card {
      background: var(--surface-soft);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);

      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 12px;

      border: 1px solid var(--border);

      box-shadow: var(--shadow-soft);

      transition: all 0.2s ease;
      cursor: pointer;
    }

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 2px;
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

    .prep {
      border-left: 4px solid #f59e0b;
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
        padding: 16px;
      }
    }
  `}</style>
</div>
);
}
