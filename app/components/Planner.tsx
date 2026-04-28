"use client";
import { useState, useEffect, useRef } from "react";
import { calculateReminderTime } from "../utils/reminders";
import { subscribeClassenseStorageSync } from "../utils/storageSync";

type ReminderItem = {
  id: number;
  logId?: number;
  eventId?: number;
  title: string;
  className: string;
  lessonDate: string;
  classTime: string;
  remindAt: string;
  type: string;
};

const timeOptions = Array.from({ length: 48 }, (_value, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, "0");
  const minutes = index % 2 === 0 ? "00" : "30";
  const value = `${hours}:${minutes}`;

  const label = new Date(`1970-01-01T${value}:00`).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return { value, label };
});

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

const formatEventDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);
  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function Planner({ setTab }: { setTab?: (tab: string) => void }) {
  const scheduledEventsRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [date, setDate] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [enableEventReminder, setEnableEventReminder] = useState(false);
  const [eventReminderTime, setEventReminderTime] = useState("2h");
  const [events, setEvents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  const loadPlannerData = () => {
    const savedClasses = JSON.parse(localStorage.getItem("classes") || "[]");
    const savedEvents = JSON.parse(localStorage.getItem("plannerEvents") || "[]");
    const savedReminders = JSON.parse(localStorage.getItem("reminders") || "[]");

    setClasses(savedClasses);
    setEvents(savedEvents);
    setReminders(savedReminders);
    setLoaded(true);
  };

  useEffect(() => {
    loadPlannerData();
    const unsubscribeSync = subscribeClassenseStorageSync(loadPlannerData);
    return () => unsubscribeSync();
  }, []);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth <= 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("plannerEvents", JSON.stringify(events));
  }, [events, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("reminders", JSON.stringify(reminders));
  }, [reminders, loaded]);

  useEffect(() => {
    if (!loaded) return;

    if (localStorage.getItem("openPlannerSection") === "scheduled") {
      window.setTimeout(() => {
        scheduledEventsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        localStorage.removeItem("openPlannerSection");
      }, 120);
    }
  }, [loaded]);

  const upsertEventReminder = (eventId: number, eventName: string, reminderDate: string, reminderTime: string, offset: string) => {
    const remindAt = calculateReminderTime(
      new Date(`${reminderDate}T${reminderTime}:00`).toISOString(),
      offset
    ).toISOString();

    setReminders((prev) => {
      const withoutCurrent = prev.filter((item) => item.eventId !== eventId);
      return [
        ...withoutCurrent,
        {
          id: Date.now(),
          eventId,
          title: eventName,
          className: eventName,
          lessonDate: reminderDate,
          classTime: reminderTime,
          remindAt,
          type: "event",
        },
      ];
    });
  };

  const removeEventReminder = (eventId: number) => {
    setReminders((prev) => prev.filter((item) => item.eventId !== eventId));
  };

  const handleAdd = () => {
    if (!date || (!selectedClass && !eventTitle.trim())) return;

    const eventName = selectedClass || eventTitle.trim();

    if (editingId) {
      const nextEvent = {
        id: editingId,
        date,
        className: eventName,
        time,
        notes,
        reminderEnabled: enableEventReminder,
        reminderOffset: eventReminderTime,
      };

      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? nextEvent
            : e
        )
      );

      if (enableEventReminder && date && time) {
        upsertEventReminder(editingId, eventName, date, time, eventReminderTime);
      } else {
        removeEventReminder(editingId);
      }
      setEditingId(null);
    } else {
      const newEventId = Date.now();
      const newEvent = {
        id: newEventId,
        date,
        className: eventName,
        time,
        notes,
        reminderEnabled: enableEventReminder,
        reminderOffset: eventReminderTime,
      };
      setEvents((prev) => [newEvent, ...prev]);

      if (enableEventReminder && date && time) {
        upsertEventReminder(newEventId, eventName, date, time, eventReminderTime);
      }
    }

    setSelectedClass("");
    setEventTitle("");
    setTime("");
    setNotes("");
    setEnableEventReminder(false);
    setEventReminderTime("2h");
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this scheduled event?")) return;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    removeEventReminder(id);
  };

  const handleEdit = (event) => {
    setDate(event.date);
    const matchedClass = classes.find((c) => (c.name || c) === event.className);
    setSelectedClass(matchedClass ? event.className : "");
    setEventTitle(matchedClass ? "" : event.className);
    setTime(event.time);
    setNotes(event.notes);
    setEnableEventReminder(Boolean(event.reminderEnabled));
    setEventReminderTime(event.reminderOffset || "2h");
    setEditingId(event.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectEvent = (event) => {
    handleEdit(event);
  };

  const handleSelectDay = (day) => {
    const formatted = day.toISOString().split("T")[0];
    setDate(formatted);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredEvents = events
    .filter((e) => {
      const text = `${e.className} ${e.notes} ${e.date}`.toLowerCase();
      return text.includes(search.toLowerCase());
    })
    .slice()
    .sort((a, b) => {
      const left = `${a.date || ""} ${a.time || ""}`;
      const right = `${b.date || ""} ${b.time || ""}`;
      return left.localeCompare(right);
    });

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const startDay = startOfMonth.getDay();
  const days = [];

  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= endOfMonth.getDate(); d++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
  }

  const today = new Date().toISOString().split("T")[0];

  const getEventsForDate = (dateObj) => {
    const d = dateObj.toISOString().split("T")[0];
    return events.filter((e) => e.date === d);
  };

  const upcomingReminders = reminders
    .filter((item) => item.remindAt)
    .slice()
    .sort((a, b) => (a.remindAt > b.remindAt ? 1 : -1));

  const handleDeleteReminder = (id: number) => {
    if (!window.confirm("Delete this reminder?")) return;
    const updated = reminders.filter((item) => item.id !== id);
    setReminders(updated);
  };

  const handleEditReminder = (reminder: ReminderItem) => {
    if (!reminder.logId) return;
    localStorage.setItem("editLogId", reminder.logId.toString());
    setTab?.("logs");
  };

  const eventReminderPreview = (() => {
    if (!enableEventReminder || !date || !time) return "";
    return formatReminderDate(
      calculateReminderTime(new Date(`${date}T${time}:00`).toISOString(), eventReminderTime).toISOString()
    );
  })();

  return (
    <div style={{ ...container, padding: isMobile ? 16 : 20 }}>
      <div style={header}>
        <h2 style={title}>Calendar</h2>
        <div style={subtitle}>
          Plan classes, events, and reminders in one clear place.
        </div>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search classes, notes, or dates..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={input}
      />

      {/* FORM */}
      <div style={card}>
        <div style={formHeader}>
          <div>
            <div style={sectionLabel}>Add Event</div>
            <div style={sectionHint}>Add something important to your teaching schedule.</div>
          </div>
        </div>
        <div style={grid}>
          <Box label="Event Title" fullWidth>
            <input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Parent meeting, studio event..."
              style={inputInner}
            />
          </Box>

          <Box label="Class" fullWidth>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={inputInner}>
              <option value="">No linked class</option>
              {classes.map((c, i) => (
                <option key={i} value={c.name || c}>
                  {c.name || c}
                </option>
              ))}
            </select>
          </Box>

          <div style={{ ...scheduleRow, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            <Box label="Date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={dateInputInner}
              />
            </Box>

            <Box label="Time">
              <select value={time} onChange={(e) => setTime(e.target.value)} style={inputInner}>
                <option value="">Select time</option>
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Box>
          </div>

          <Box label="Notes" fullWidth>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional details" style={inputInner}/>
          </Box>

          <div style={reminderCard}>
            <div style={sectionLabel}>Reminder</div>
            <div style={reminderToggleRow}>
              <div style={sectionHint}>
                Turn this on if you want a reminder before the event.
              </div>
              <button
                onClick={() => setEnableEventReminder((current) => !current)}
                style={{
                  ...toggleBtn,
                  background: enableEventReminder ? "rgba(59,130,246,0.18)" : "var(--surface)",
                }}
              >
                {enableEventReminder ? "On" : "Off"}
              </button>
            </div>

            {enableEventReminder && (
              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                <select
                  value={eventReminderTime}
                  onChange={(e) => setEventReminderTime(e.target.value)}
                  style={inputInner}
                >
                  <option value="30m">30 minutes before</option>
                  <option value="1h">1 hour before</option>
                  <option value="2h">2 hours before</option>
                  <option value="12h">12 hours before</option>
                  <option value="1d">1 day before</option>
                  <option value="2d">2 days before</option>
                  <option value="1w">1 week before</option>
                </select>

                {eventReminderPreview && (
                  <div style={reminderPreviewStyle}>
                    Reminder will be sent around {eventReminderPreview}.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleAdd}
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
          {editingId ? "Update Event" : "Add to Planner"}
        </button>
      </div>

      {/* MONTH HEADER */}
      <div style={{ ...monthHeader, gap: isMobile ? 8 : 0 }}>
        <button
          style={monthBtn}
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--ghost-bg)";
            e.currentTarget.style.borderColor = "var(--border-strong)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--surface)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          ←
        </button>
        <div style={{ ...monthTitle, fontSize: isMobile ? 16 : 18, textAlign: "center" as const }}>
          {currentMonth.toLocaleString("default", { month: "long" })} {currentMonth.getFullYear()}
        </div>
        <button
          style={monthBtn}
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--ghost-bg)";
            e.currentTarget.style.borderColor = "var(--border-strong)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--surface)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          →
        </button>
      </div>

      {/* WEEK */}
      <div style={weekGrid}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} style={weekDay}>{d}</div>
        ))}
      </div>

      {/* CALENDAR */}
      <div style={calendarGrid}>
        {days.map((day, i) => {
          const isToday = day && day.toISOString().split("T")[0] === today;
          const dayEvents = day ? getEventsForDate(day) : [];

          return (
            <div
              key={i}
              style={{
                ...dayBox,
                minHeight: isMobile ? 52 : dayBox.minHeight,
                background: isToday ? "rgba(37,99,235,0.16)" : "var(--surface-soft)",
                border: isToday ? "2px solid #2563eb" : "1px solid var(--border)",
              }}
              onClick={() => day && handleSelectDay(day)}
            >
              {day && (
                <>
                  <div style={dayNumber}>{day.getDate()}</div>

                  {dayEvents.length > 0 ? (
                    <div style={eventMarkersWrap}>
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          style={eventDot}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleSelectEvent(e);
                          }}
                        />
                      ))}
                      {dayEvents.length > 3 ? (
                        <span style={eventCountBadge}>+{dayEvents.length - 3}</span>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* LIST */}
      <div ref={scheduledEventsRef} style={listSection}>
          <div style={listHeader}>
            <div style={listTitle}>Scheduled Events</div>
          <div style={listHint}>This is where the full event details live.</div>
        </div>

        {filteredEvents.length === 0 && (
          <div style={eventCard}>
            <strong style={eventCardTitle}>Nothing scheduled yet</strong>
            <div style={notesStyle}>
              Add an event above to start building out your calendar.
            </div>
          </div>
        )}

        {filteredEvents.map((e) => (
          <div
            key={e.id}
            style={eventCard}
            onMouseEnter={(el) => {
              el.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(el) => {
              el.currentTarget.style.transform = "none";
            }}
          >
            <div style={{ ...eventMetaRow, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }}>
              <strong style={eventCardTitle}>{e.className}</strong>
              <span style={eventDateBadge}>
                {formatEventDate(e.date)}
                {e.time && ` • ${e.time}`}
              </span>
            </div>

            {e.notes && <div style={notesStyle}>{e.notes}</div>}

            <div style={{ ...actions, flexWrap: "wrap" }}>
              <button
                onClick={() => handleEdit(e)}
                style={editBtn}
                onMouseEnter={(ev) => {
                  ev.currentTarget.style.transform = "translateY(-1px)";
                  ev.currentTarget.style.background = "rgba(37,99,235,0.12)";
                }}
                onMouseLeave={(ev) => {
                  ev.currentTarget.style.transform = "none";
                  ev.currentTarget.style.background = "var(--surface)";
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(e.id)}
                style={deleteBtn}
                onMouseEnter={(ev) => {
                  ev.currentTarget.style.transform = "translateY(-1px)";
                  ev.currentTarget.style.background = "rgba(239,68,68,0.18)";
                }}
                onMouseLeave={(ev) => {
                  ev.currentTarget.style.transform = "none";
                  ev.currentTarget.style.background = "rgba(239,68,68,0.12)";
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={listSection}>
        <div style={listHeader}>
          <div style={listTitle}>Reminder Queue</div>
          <div style={listHint}>Lesson prep reminders and calendar event reminders.</div>
        </div>

        {upcomingReminders.length === 0 && (
          <div style={eventCard}>
            <strong style={eventCardTitle}>No reminders yet</strong>
            <div style={notesStyle}>
              Save a lesson with a prep reminder turned on and it will appear here.
            </div>
          </div>
        )}

        {upcomingReminders.map((reminder) => (
          <div key={reminder.id} style={eventCard}>
            <div style={{ ...eventMetaRow, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }}>
              <strong style={eventCardTitle}>{reminder.title}</strong>
              <span style={eventDateBadge}>{formatReminderDate(reminder.remindAt)}</span>
            </div>
            <div style={notesStyle}>
              {reminder.className}
              {reminder.lessonDate ? ` • ${reminder.type === "event" ? "Event" : "Lesson"} ${formatEventDate(reminder.lessonDate)}` : ""}
            </div>
            <div style={{ ...actions, flexWrap: "wrap" }}>
              {(reminder.logId || reminder.eventId) && (
                <button
                  onClick={() => {
                    if (reminder.eventId) {
                      const eventMatch = events.find((event) => event.id === reminder.eventId);
                      if (eventMatch) handleEdit(eventMatch);
                      return;
                    }
                    handleEditReminder(reminder);
                  }}
                  style={editBtn}
                  onMouseEnter={(ev) => {
                    ev.currentTarget.style.transform = "translateY(-1px)";
                    ev.currentTarget.style.background = "rgba(37,99,235,0.12)";
                  }}
                  onMouseLeave={(ev) => {
                    ev.currentTarget.style.transform = "none";
                    ev.currentTarget.style.background = "var(--surface)";
                  }}
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => handleDeleteReminder(reminder.id)}
                style={deleteBtn}
                onMouseEnter={(ev) => {
                  ev.currentTarget.style.transform = "translateY(-1px)";
                  ev.currentTarget.style.background = "rgba(239,68,68,0.18)";
                }}
                onMouseLeave={(ev) => {
                  ev.currentTarget.style.transform = "none";
                  ev.currentTarget.style.background = "rgba(239,68,68,0.12)";
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

function Box({ label, children, fullWidth = false }) {
  return (
    <div style={{ ...box, ...(fullWidth ? fullWidthBox : {}) }}>
      <label style={{ fontSize: 12, color: "var(--muted)" }}>{label}</label>
      {children}
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

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  marginBottom: 12,
  background: "var(--input-bg)",
  color: "var(--text)",
  boxSizing: "border-box" as const,
};

const inputInner = {
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--input-bg)",
  color: "var(--text)",
  boxSizing: "border-box" as const,
};

const dateInputInner = {
  ...inputInner,
  display: "block",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
  overflow: "hidden",
  minHeight: 44,
};

const card = {
  background: "var(--premium-panel)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(148,163,184,0.16)",
  borderRadius: 20,
  padding: 18,
  marginBottom: 12,
  boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
};

const reminderCard = {
  background: "var(--premium-panel-strong)",
  border: "1px solid rgba(59,130,246,0.16)",
  borderRadius: 18,
  padding: 12,
  display: "grid",
  gap: 8,
};

const reminderToggleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const toggleBtn = {
  minWidth: 72,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  cursor: "pointer",
  color: "var(--text)",
};

const reminderPreviewStyle = {
  fontSize: 13,
  color: "var(--muted)",
  padding: "10px 12px",
  borderRadius: 10,
  background: "var(--info-soft)",
  border: "1px solid var(--info-soft-border)",
};

const formHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 10,
};

const sectionLabel = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "var(--muted)",
  marginBottom: 4,
};

const sectionHint = {
  fontSize: 13,
  lineHeight: 1.45,
  color: "var(--muted)",
};

const grid = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 10,
};

const box = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 4,
  width: "100%",
  minWidth: 0,
};

const fullWidthBox = {
  width: "100%",
};

const scheduleRow = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  width: "100%",
};

const btn = {
  marginTop: 10,
  padding: "11px 14px",
  borderRadius: 16,
  background: "linear-gradient(135deg,#1e3a8a,#2563eb,#60a5fa)",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  width: "100%",
  boxShadow: "var(--shadow-soft)",
};

const monthHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 14,
  marginBottom: 8,
  color: "var(--text)",
};

const monthTitle = {
  fontSize: 18,
  fontWeight: 600,
  letterSpacing: "-0.01em",
};

const monthBtn = {
  width: 32,
  height: 32,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  cursor: "pointer",
  transition: "all 0.18s ease",
};

const weekGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  fontSize: 11,
  marginTop: 4,
  textAlign: "center",
  color: "var(--muted)",
};

const weekDay = {
  padding: "2px 0 4px",
  fontWeight: 600,
};

const calendarGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 4,
  marginTop: 6,
};

const dayBox = {
  borderRadius: 10,
  minHeight: 58,
  padding: 4,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const dayNumber = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text)",
};

const eventMarkersWrap = {
  marginTop: 8,
  display: "flex",
  alignItems: "center",
  gap: 4,
  flexWrap: "wrap" as const,
};

const eventDot = {
  width: 8,
  height: 8,
  background: "rgba(37,99,235,0.92)",
  borderRadius: 999,
  display: "inline-block",
};

const eventCountBadge = {
  fontSize: 9,
  fontWeight: 700,
  color: "var(--muted)",
};

const listSection = {
  marginTop: 18,
};

const listHeader = {
  marginBottom: 10,
};

const listTitle = {
  fontSize: 16,
  fontWeight: 600,
  color: "var(--text)",
  letterSpacing: "-0.01em",
};

const listHint = {
  marginTop: 4,
  fontSize: 13,
  lineHeight: 1.45,
  color: "var(--muted)",
};

const eventCard = {
  marginTop: 8,
  padding: 14,
  borderRadius: 16,
  background: "var(--premium-panel)",
  border: "1px solid rgba(148,163,184,0.16)",
  transition: "all 0.2s ease",
  boxShadow: "0 14px 28px rgba(15,23,42,0.07)",
  color: "var(--text)",
};

const eventMetaRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const eventCardTitle = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--text)",
};

const eventDateBadge = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--tag-text)",
  background: "var(--tag-surface)",
  border: "1px solid var(--info-soft-border)",
  borderRadius: 999,
  padding: "4px 8px",
  whiteSpace: "nowrap" as const,
};

const notesStyle = {
  marginTop: 4,
  fontSize: 13,
  lineHeight: 1.45,
  color: "var(--muted)",
};

const actions = {
  marginTop: 8,
  display: "flex",
  gap: 10,
};

const editBtn = {
  minWidth: 72,
  minHeight: 36,
  background: "var(--edit-surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 10,
  color: "var(--tag-text)",
  cursor: "pointer",
  fontWeight: 500,
};

const deleteBtn = {
  minWidth: 72,
  minHeight: 36,
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.25)",
  borderRadius: 10,
  color: "#ef4444",
  cursor: "pointer",
  fontWeight: 500,
};
