import React, { useEffect, useState } from "react";
import Header from "./components/Header/Header";
import Login from "./components/Login/Login";
import { supabase } from "./lib/supabaseClient";
import type { Streak } from "./models/streak.model";
import "./App.css";

// Helper to get date string for storage & comparison
const getDateString = (date: Date) => date.toDateString();

const todayString = getDateString(new Date());

// Define views
type View = "list" | "detail";
type StatusType = "completed" | "pending" | "missed";

const App: React.FC = () => {
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const getMillisecondsTo9PM = () => {
    const now = new Date();
    const ninePM = new Date();
    ninePM.setHours(21, 0, 0, 0);
    if (now > ninePM) {
      ninePM.setDate(ninePM.getDate() + 1);
    }
    return ninePM.getTime() - now.getTime();
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      const scheduleNotification = () => {
        new Notification("Streak Reminder", {
          body: "Don't forget to complete your streak today! 🚀",
        });
      };

      const delay = getMillisecondsTo9PM();

      const timeoutId = setTimeout(() => {
        scheduleNotification();
        const intervalId = setInterval(
          scheduleNotification,
          24 * 60 * 60 * 1000,
        );
        return () => clearInterval(intervalId);
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Authentication and Data Loading States
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // State
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [currentView, setCurrentView] = useState<View>("list");
  const [selectedStreakId, setSelectedStreakId] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState<string | undefined>("🔥");

  // Listen to Auth state changes
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      })
      .catch((err) => {
        console.error("Error getting session:", err);
      })
      .finally(() => {
        setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch Streaks when user is logged in
  useEffect(() => {
    if (user) {
      fetchStreaks();
    } else {
      setStreaks([]);
    }
  }, [user]);

  async function fetchStreaks() {
    try {
      setDataLoading(true);
      const { data, error } = await supabase
        .from("streaks")
        .select("*")
        .order("id", { ascending: true });
      
      if (error) throw error;

      const mapped: Streak[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        count: row.count,
        createdDate: row.created_date,
        lastCompleted: row.last_completed,
        completedDates: row.completed_dates || [],
        emoji: row.emoji,
      }));

      setStreaks(mapped);
    } catch (err) {
      console.error("Error fetching streaks:", err);
    } finally {
      setDataLoading(false);
    }
  }

  // Add new streak handler
  async function handleAddStreak(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !user) return;

    const newStreak = {
      user_id: user.id,
      name: name.trim(),
      description: description.trim() || "",
      count: 0,
      created_date: todayString,
      last_completed: null,
      completed_dates: [],
      emoji: emoji || "🔥",
    };

    try {
      const { data, error } = await supabase
        .from("streaks")
        .insert([newStreak])
        .select();
      if (error) throw error;

      if (data && data[0]) {
        const row = data[0];
        const added: Streak = {
          id: row.id,
          name: row.name,
          description: row.description,
          count: row.count,
          createdDate: row.created_date,
          lastCompleted: row.last_completed,
          completedDates: row.completed_dates || [],
          emoji: row.emoji,
        };
        setStreaks((prev) => [...prev, added]);
      }
      setName("");
      setDescription("");
    } catch (err) {
      console.error("Error adding streak:", err);
    }
  }

  // Complete streak today if not already completed
  async function completeStreak(id: number) {
    const streak = streaks.find((s) => s.id === id);
    if (!streak) return;

    const isCompletedToday = streak.lastCompleted === todayString;
    
    // Toggle completion
    if (isCompletedToday) {
      await uncompleteStreak(id);
      return;
    }

    const newCount = streak.count + 1;
    const newCompletedDates = [...streak.completedDates, todayString];

    try {
      // Optimistic Update
      setStreaks((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            return {
              ...s,
              count: newCount,
              lastCompleted: todayString,
              completedDates: newCompletedDates,
            };
          }
          return s;
        })
      );

      const { error } = await supabase
        .from("streaks")
        .update({
          count: newCount,
          last_completed: todayString,
          completed_dates: newCompletedDates,
        })
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("Error completing streak:", err);
      fetchStreaks();
    }
  }

  // Mark yesterday done if not already completed
  async function completeYesterdayStreak(id: number) {
    const streak = streaks.find((s) => s.id === id);
    if (!streak) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = getDateString(yesterday);

    if (streak.completedDates.includes(yesterdayString)) return;
    if (streak.lastCompleted === todayString) return;

    const newCount = streak.count + 1;
    const newCompletedDates = [...streak.completedDates, yesterdayString];

    try {
      // Optimistic Update
      setStreaks((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            return {
              ...s,
              count: newCount,
              lastCompleted: yesterdayString,
              completedDates: newCompletedDates,
            };
          }
          return s;
        })
      );

      const { error } = await supabase
        .from("streaks")
        .update({
          count: newCount,
          last_completed: yesterdayString,
          completed_dates: newCompletedDates,
        })
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("Error completing yesterday streak:", err);
      fetchStreaks();
    }
  }

  // Uncomplete streak for today only
  async function uncompleteStreak(id: number) {
    const streak = streaks.find((s) => s.id === id);
    if (!streak || streak.lastCompleted !== todayString) return;

    const updatedCompletedDates = streak.completedDates.filter(
      (date) => date !== todayString
    );
    const newCount = Math.max(0, streak.count - 1);
    const newLastCompleted = updatedCompletedDates.length > 0
      ? updatedCompletedDates[updatedCompletedDates.length - 1]
      : null;

    try {
      // Optimistic Update
      setStreaks((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            return {
              ...s,
              count: newCount,
              lastCompleted: newLastCompleted,
              completedDates: updatedCompletedDates,
            };
          }
          return s;
        })
      );

      const { error } = await supabase
        .from("streaks")
        .update({
          count: newCount,
          last_completed: newLastCompleted,
          completed_dates: updatedCompletedDates,
        })
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("Error uncompleting streak:", err);
      fetchStreaks();
    }
  }

  // Delete streak handler
  async function deleteStreak(id: number) {
    try {
      // Optimistic Update
      setStreaks((prev) => prev.filter((s) => s.id !== id));
      if (selectedStreakId === id) {
        setSelectedStreakId(null);
        setCurrentView("list");
      }

      const { error } = await supabase
        .from("streaks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("Error deleting streak:", err);
      fetchStreaks();
    }
  }

  // Get yesterday string
  const getYesterdayString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getDateString(d);
  };

  // Determine streak status for UI
  const getStreakStatus = (streak: Streak) => {
    if (streak.lastCompleted === todayString) {
      return {
        status: "completed" as StatusType,
        text: "Completed Today!",
        className: "status-completed",
        iconClass: "icon-completed",
      };
    }

    const yesterdayString = getYesterdayString();

    if (streak.count === 0) {
      return {
        status: "pending" as StatusType,
        text: "Ready to Start",
        className: "status-pending",
        iconClass: "icon-pending",
      };
    }

    if (streak.lastCompleted === yesterdayString) {
      return {
        status: "pending" as StatusType,
        text: "Pending Today",
        className: "status-pending",
        iconClass: "icon-pending",
      };
    }

    return {
      status: "missed" as StatusType,
      text: "Missed Yesterday",
      className: "status-missed",
      iconClass: "icon-missed",
    };
  };

  // Calculate current streak length in days
  const getCurrentStreak = (streak: Streak) => {
    if (streak.completedDates.length === 0) return 0;

    const today = new Date();
    const sortedDates = streak.completedDates
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 0;
    let checkDate = new Date(today);

    for (const completedDate of sortedDates) {
      const daysDiff = Math.floor(
        (checkDate.getTime() - completedDate.getTime()) / (1000 * 3600 * 24),
      );
      if (daysDiff === 0 || daysDiff === 1) {
        currentStreak++;
        checkDate = new Date(completedDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return currentStreak;
  };

  // Calculate longest streak length in days
  const getLongestStreak = (streak: Streak) => {
    if (streak.completedDates.length === 0) return 0;
    const sortedDates = streak.completedDates
      .map((d) => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());
    let longestStreak = 0;
    let currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const diff =
        (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) /
        (1000 * 3600 * 24);
      if (diff === 1) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    return longestStreak;
  };

  // Render contribution graph for a streak
  const renderContributionGraph = (streak: Streak) => {
    const today = new Date();
    const year = today.getFullYear();

    const completedSet = new Set(
      streak.completedDates.map((d) => new Date(d).toDateString()),
    );

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthDays = [
      31,
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];

    const daysNumbers = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
      <div className="contribution-graph">
        <div className="grid-table">
          <div className="grid-row grid-header">
            <div className="grid-month-label" />
            {daysNumbers.map((dayNum) => (
              <div key={dayNum} className="grid-day-label">
                {dayNum}
              </div>
            ))}
          </div>

          {months.map((month, mIdx) => (
            <div className="grid-row" key={month}>
              <div className="grid-month-label">{month}</div>
              {daysNumbers.map((dayNum) => {
                if (dayNum > monthDays[mIdx]) {
                  return <div key={dayNum} className="grid-cell empty" />;
                }

                const cellDate = new Date(year, mIdx, dayNum);
                const cellString = cellDate.toDateString();
                const isFuture = cellDate > today;
                const isCompleted = completedSet.has(cellString);

                let className = "grid-cell";
                let title = "";

                if (isFuture) {
                  className += " cell-future";
                  title = `Scheduled for ${dayNum} ${month}`;
                } else if (isCompleted) {
                  className += " cell-completed";
                  title = `Completed on ${dayNum} ${month}`;
                } else {
                  className += " cell-missed";
                  title = `Missed on ${dayNum} ${month}`;
                }

                return (
                  <div key={dayNum} className={className} title={title}>
                    {isCompleted ? streak.emoji || "🔥" : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Handle streak click to show detail view
  const handleStreakClick = (streakId: number) => {
    setSelectedStreakId(streakId);
    setCurrentView("detail");
  };

  // Handle back to list view
  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedStreakId(null);
  };

  // Get the selected streak from the streaks array
  const selectedStreak = streaks.find((s) => s.id === selectedStreakId) || null;

  function toReadableDate(date: Date) {
    return date.toDateString(); // "Sat Jan 24 2026"
  }

  function getWeekDaysStatus(streak: Streak) {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Monday as start
    const monday = new Date(today);
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + diff);

    const days = ["M", "T", "W", "T", "F", "S", "S"];

    return days.map((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateString = toReadableDate(date);

      return {
        label,
        dateString,
        isToday: dateString === todayString,
        completed: streak.completedDates.includes(dateString),
      };
    });
  }

  // Render list view
  const renderListView = () => (
    <div className="container">
      {streaks.length === 0 ? (
        <div className="empty-state">
          <p>No streaks yet! Add your first streak above to get started. 🎯</p>
        </div>
      ) : (
        <section className="streaks-list">
          {streaks.map((streak) => {
            const status = getStreakStatus(streak);
            const isCompletedToday = streak.lastCompleted === todayString;

            return (
              <article key={streak.id} className="streak-card">
                <div className="streak-card-header">
                  <div
                    className="streak-emoji"
                    onClick={() => handleStreakClick(streak.id)}
                  >
                    {streak.emoji || "🔥"}
                  </div>

                  <div
                    className="streak-info"
                    onClick={() => handleStreakClick(streak.id)}
                  >
                    <div className="streak-title">{streak.name}</div>
                    <div className={`status-chip ${status.status}`}>
                      {status.text}
                    </div>
                  </div>
                </div>

                <div className="streak-card-content">
                  <div className="streak-count">
                    {getCurrentStreak(streak)} 🔥
                  </div>

                  {!isCompletedToday ? (
                    <button
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        completeStreak(streak.id);
                      }}
                      aria-label={`Complete streak ${streak.name} today`}
                    >
                      Done
                    </button>
                  ) : (
                    <div className="btn-spacer"></div>
                  )}
                </div>

                <div className="week-days">
                  {getWeekDaysStatus(streak).map((day, index) => (
                    <div
                      key={index}
                      className={`day-box 
        ${day.completed ? "done" : "not-done"} 
        ${day.isToday ? "today" : ""}`}
        onClick={() => completeStreak(streak.id)}
                    >
                      {day.label}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );

  // Render detail view
  const renderDetailView = () => {
    if (!selectedStreak) return null;

    const status = getStreakStatus(selectedStreak);
    const isCompletedToday = selectedStreak.lastCompleted === todayString;

    return (
      <div className="container detail-view">
        <button className="btn btn-back" onClick={handleBackToList}>
          ← Back to List
        </button>

        <article className="streak-detail-card">
          <div className="streak-detail-header">
            <div>
              <div className="streak-detail-title">
                <span className="streak-detail-emoji">
                  {selectedStreak.emoji || "🔥"}
                </span>
                {selectedStreak.name}
              </div>
              {selectedStreak.description && (
                <div className="streak-detail-description">
                  {selectedStreak.description}
                </div>
              )}
            </div>

            <div className="streak-detail-count">
              {getCurrentStreak(selectedStreak)} 🔥
            </div>
          </div>

          <div className="streak-detail-progress">
            <div className="progress-stats">
              <div className="progress-stat">
                <div className="stat-indicator green"></div>
                Total: {selectedStreak.count} days
              </div>
              <div className="progress-stat">
                <div className="stat-indicator orange"></div>
                Longest: {getLongestStreak(selectedStreak)} days
              </div>
            </div>
            {renderContributionGraph(selectedStreak)}
          </div>

          <div className="streak-detail-dates">
            Started: {new Date(selectedStreak.createdDate).toLocaleDateString()}
            {selectedStreak.lastCompleted &&
              ` | Last: ${new Date(selectedStreak.lastCompleted).toLocaleDateString()}`}
          </div>

          <div className="streak-detail-actions">
            <div className={`streak-status ${status.status}`}>
              {status.text}
            </div>
            <div className="action-buttons">
              {isCompletedToday ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => uncompleteStreak(selectedStreak.id)}
                  aria-label={`Undo completion for ${selectedStreak.name}`}
                >
                  Undo Today
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={() => completeYesterdayStreak(selectedStreak.id)}
                    aria-label={`Complete streak ${selectedStreak.name} today`}
                  >
                    ✅ Mark yesterday Done
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={() => completeStreak(selectedStreak.id)}
                    aria-label={`Complete streak ${selectedStreak.name} today`}
                  >
                    ✅ Done
                  </button>
                </>
              )}

              <button
                className="btn btn-danger"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete streak "${selectedStreak.name}"? This cannot be undone.`,
                    )
                  ) {
                    deleteStreak(selectedStreak.id);
                  }
                }}
                aria-label={`Delete streak ${selectedStreak.name}`}
              >
                Delete
              </button>
            </div>
          </div>
        </article>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-glow"></div>
        <div className="spinner-container">
          <div className="premium-spinner"></div>
          <p>Connecting to your habits...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <Header
        handleAddStreak={handleAddStreak}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        emoji={emoji}
        setEmoji={setEmoji}
        user={user}
      />
      {dataLoading ? (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <div className="premium-spinner" style={{ width: '40px', height: '40px' }}></div>
        </div>
      ) : currentView === "list" ? (
        renderListView()
      ) : (
        renderDetailView()
      )}
    </>
  );
};

export default App;
