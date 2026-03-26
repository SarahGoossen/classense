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

export default function Home({ setTab }: any) {
  const userName = getUserName();
  const [logs, setLogs] = useState<Log[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // 🔥 CENTRALIZED LOADER
  const loadData = () => {
    const savedLogs = localStorage.getItem("logs");
    const savedClasses = localStorage.getItem("classes");

    setLogs(savedLogs ? JSON.parse(savedLogs) : []);
    setClasses(savedClasses ? JSON.parse(savedClasses) : []);
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

const thisWeekCount = logs.length;

return (
<div className="page">
  <div className="bg-glow" />

  <div className="content">
    <div className="header">
      <div className="title">Dashboard</div>

      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginTop: 8,
          marginBottom: 6,
          lineHeight: 1.3,
          background: "linear-gradient(135deg,#1e3a8a,#2563eb,#60a5fa)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {userName
          ? `Welcome back, ${userName}. Your teaching command center is ready.`
          : "Welcome. Your teaching command center is ready."}
      </div>

      <div className="subtitle">Stay on top of your lessons</div>
    </div>

    <div className="actions">
      <button onClick={() => setTab("logs")} className="lux-btn">
        + Lesson
      </button>

      <button onClick={() => setTab("classes")} className="lux-btn">
        + Class
      </button>
    </div>

    <div className="stats">
      <div className="stat">
        <div>{logs.length}</div>
        <span>Logs</span>
      </div>

      <div className="stat">
        <div>{classes.length}</div>
        <span>Classes</span>
      </div>

      <div className="stat">
        <div>{thisWeekCount}</div>
        <span>Week</span>
      </div>
    </div>

    <div>
      <div className="section-title">Prep Needed</div>

      {upcomingPrep.length === 0 && (
        <div className="card">All classes prepared 🎉</div>
      )}

      {upcomingPrep.map((c, i) => (
        <div
          key={i}
          className="card prep"
          onClick={() => {
            localStorage.setItem("lastUsedClass", c.name);
            localStorage.setItem("forcedDate", "");
            setTab("logs");
          }}
        >
          <div>⚠️ {c.name}</div>
          <small>
            {typeof c.day === "number" ? dayNames[c.day] : c.day} •{" "}
            {formatTime(c.displayTime)}
          </small>
        </div>
      ))}
    </div>

    <div>
      <div className="section-title">Recent Lessons</div>

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
      background: #f4f6fb;
      overflow: hidden;
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
    }

    .subtitle {
      font-size: 13px;
      color: #666;
    }

    .header {
      margin-bottom: 20px;
    }

    .actions {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }

    .lux-btn {
      flex: 1;
      padding: 20px;
      border-radius: 16px;
      border: none;
      color: white;
      font-weight: 600;
      font-size: 16px;
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

    .lux-btn:hover {
      transform: translateY(-3px);
      background-position: 100% 50%;
    }

    .stats {
      display: flex;
      gap: 12px;
      margin-bottom: 22px;
    }

    .stat {
      flex: 1;
      padding: 10px;
      border-radius: 10px;
      text-align: center;
      color: white;
      background: linear-gradient(135deg, #6b1f2a, #b91c1c, #7f1d1d);
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2),
        0 6px 14px rgba(0, 0, 0, 0.15);
    }

    .section-title {
      font-weight: 500;
      margin-bottom: 10px;
    }

    .card {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);

      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 12px;

      border: 1px solid rgba(255, 255, 255, 0.6);

      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06),
        0 1px 2px rgba(0, 0, 0, 0.04);

      transition: all 0.2s ease;
    }

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 2px;
      letter-spacing: -0.2px;
    }

    .card-sub {
      font-size: 12.5px;
      color: #6b7280;
      line-height: 1.4;
    }

    .card:hover {
      transform: translateY(-4px) scale(1.01);

      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.12),
        0 0 0 1px rgba(99, 102, 241, 0.08);

      background: rgba(255, 255, 255, 0.95);
    }

    .prep {
      border-left: 4px solid #f59e0b;
    }
  `}</style>
</div>
);
}