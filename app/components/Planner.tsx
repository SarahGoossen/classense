"use client";
import { useState, useEffect } from "react";

export default function Planner() {
  const [date, setDate] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [events, setEvents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const savedClasses = JSON.parse(localStorage.getItem("classes") || "[]");
    const savedEvents = JSON.parse(localStorage.getItem("plannerEvents") || "[]");

    setClasses(savedClasses);
    setEvents(savedEvents);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("plannerEvents", JSON.stringify(events));
  }, [events, loaded]);

  const handleAdd = () => {
    if (!date || !selectedClass) return;

    if (editingId) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? { ...e, date, className: selectedClass, time, notes }
            : e
        )
      );
      setEditingId(null);
    } else {
      const newEvent = {
        id: Date.now(),
        date,
        className: selectedClass,
        time,
        notes,
      };
      setEvents((prev) => [newEvent, ...prev]);
    }

    setNotes("");
  };

  const handleDelete = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleEdit = (event) => {
    setDate(event.date);
    setSelectedClass(event.className);
    setTime(event.time);
    setNotes(event.notes);
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

  const filteredEvents = events.filter((e) => {
    const text = `${e.className} ${e.notes} ${e.date}`.toLowerCase();
    return text.includes(search.toLowerCase());
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

  return (
    <div style={container}>
      <h2 style={title}>Planner</h2>

      {/* SEARCH */}
      <input
        placeholder="Search class, notes, date..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={input}
      />

      {/* FORM */}
      <div style={card}>
        <div style={grid}>
          <Box label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputInner}/>
          </Box>

          <Box label="Class">
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={inputInner}>
              <option value="">Select class</option>
              {classes.map((c, i) => (
                <option key={i} value={c.name || c}>
                  {c.name || c}
                </option>
              ))}
            </select>
          </Box>

          <Box label="Time">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputInner}/>
          </Box>

          <Box label="Notes">
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" style={inputInner}/>
          </Box>
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
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {editingId ? "Update Event" : "Add to Planner"}
        </button>
      </div>

      {/* MONTH HEADER */}
      <div style={monthHeader}>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>←</button>
        <strong>
          {currentMonth.toLocaleString("default", { month: "long" })} {currentMonth.getFullYear()}
        </strong>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>→</button>
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

          return (
            <div
              key={i}
              style={{
                ...dayBox,
                background: isToday ? "#eef5ff" : "rgba(255,255,255,0.7)",
                border: isToday ? "2px solid #2563eb" : "1px solid rgba(0,0,0,0.08)",
              }}
              onClick={() => day && handleSelectDay(day)}
            >
              {day && (
                <>
                  <div style={dayNumber}>{day.getDate()}</div>

                  {getEventsForDate(day).map((e) => (
                    <div
                      key={e.id}
                      style={eventDot}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleSelectEvent(e);
                      }}
                    >
                      {e.className}
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* LIST */}
      <h3 style={{ marginTop: 20 }}>Upcoming</h3>

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
          <div>
            <strong>{e.date}</strong> {e.time && `• ${e.time}`}
          </div>

          <div>{e.className}</div>

          {e.notes && <div style={notesStyle}>{e.notes}</div>}

          <div style={actions}>
            <button onClick={() => handleEdit(e)} style={editBtn}>Edit</button>
            <button onClick={() => handleDelete(e.id)} style={deleteBtn}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Box({ label, children }) {
  return (
    <div style={box}>
      <label style={{ fontSize: 12, color: "#6b7280" }}>{label}</label>
      {children}
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
  marginBottom: 12,
};

const input = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.08)",
  marginBottom: 12,
};

const inputInner = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid rgba(0,0,0,0.08)",
  boxSizing: "border-box", // 🔥 critical fix
};

const card = {
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(255,255,255,0.6)",
  borderRadius: 14,
  padding: 16,
  marginBottom: 12,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  alignItems: "stretch", // 🔥 aligns everything clean
};

const box = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  width: "100%", // 🔥 important
};

const btn = {
  marginTop: 12,
  padding: 12,
  borderRadius: 12,
  background: "linear-gradient(135deg,#1e3a8a,#2563eb,#60a5fa)",
  color: "white",
  border: "none",
  cursor: "pointer",
};

const monthHeader = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 16,
};

const weekGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  fontSize: 11,
  marginTop: 6,
  textAlign: "center",
};

const weekDay = { padding: 2 };

const calendarGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 6,
  marginTop: 6,
};

const dayBox = {
  borderRadius: 8,
  minHeight: 70,
  padding: 6,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const dayNumber = {
  fontSize: 12,
  fontWeight: 600,
};

const eventDot = {
  marginTop: 3,
  fontSize: 10,
  background: "#2563eb",
  color: "#fff",
  borderRadius: 6,
  padding: "2px 6px",
};

const eventCard = {
  marginTop: 10,
  padding: 12,
  borderRadius: 12,
  background: "rgba(255,255,255,0.75)",
  border: "1px solid rgba(255,255,255,0.6)",
  transition: "all 0.2s ease",
};

const notesStyle = {
  marginTop: 4,
  fontSize: 13,
  color: "#6b7280",
};

const actions = {
  marginTop: 6,
  display: "flex",
  gap: 10,
};

const editBtn = {
  background: "none",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
};

const deleteBtn = {
  background: "none",
  border: "none",
  color: "#ef4444",
  cursor: "pointer",
};