import React, { useEffect, useState } from "react";
import Header from "./components/Header/Header";
import type { Streak } from "./models/streak.model";

// Helper to get date string for storage & comparison
const getDateString = (date: Date) => date.toDateString();

const todayString = getDateString(new Date());

// Define views
type View = "list" | "detail";

const App: React.FC = () => {
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const getMillisecondsTo9PM = () => {
    const now = new Date();
    const ninePM = new Date();
    ninePM.setHours(21, 0, 0, 0); // 9 PM today
    if (now > ninePM) {
      // If now is past 9 PM, target is 9 PM tomorrow
      ninePM.setDate(ninePM.getDate() + 1);
    }
    return ninePM.getTime() - now.getTime();
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      const scheduleNotification = () => {
        new Notification("Streak Reminder", {
          body: "Don't forget to complete your streak today! 🚀",
          // icon: "/path-to-icon.png", // optional
        });
      };

      const delay = getMillisecondsTo9PM();

      const timeoutId = setTimeout(() => {
        scheduleNotification();

        // Repeat every 24 hours
        const intervalId = setInterval(
          scheduleNotification,
          24 * 60 * 60 * 1000
        );

        // Clean up interval on unmount
        return () => clearInterval(intervalId);
      }, delay);

      // Clean up timeout on unmount
      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Load streaks from localStorage or empty array
  const loadStreaks = (): Streak[] => {
    try {
      const saved = localStorage.getItem("streaks");
      if (!saved) return [];
      const parsed: Streak[] = JSON.parse(saved);
      return parsed;
    } catch {
      return [];
    }
  };

  // State
  const [streaks, setStreaks] = useState<Streak[]>(loadStreaks);
  const [currentView, setCurrentView] = useState<View>("list");
  const [selectedStreakId, setSelectedStreakId] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState<string | undefined>("🔥");

  // Save streaks to localStorage whenever streaks change
  useEffect(() => {
    localStorage.setItem("streaks", JSON.stringify(streaks));
  }, [streaks]);

  // Add new streak handler
  function handleAddStreak(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const newStreak: Streak = {
      id: Date.now(),
      name: name.trim(),
      description: description.trim() || "",
      count: 0,
      createdDate: todayString,
      lastCompleted: null,
      completedDates: [],
      emoji: emoji || "🔥", // Set chosen emoji
    };

    setStreaks((prev) => [...prev, newStreak]);
    setName("");
    setDescription("");
  }

  // Complete streak today if not already completed
  function completeStreak(id: number) {
    setStreaks((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          if (s.lastCompleted === todayString) return s;

          return {
            ...s,
            count: s.count + 1,
            lastCompleted: todayString,
            completedDates: [...s.completedDates, todayString],
          };
        }
        return s;
      })
    );
  }

  // Uncomplete streak for today only
  function uncompleteStreak(id: number) {
    setStreaks((prev) =>
      prev.map((s) => {
        if (s.id === id && s.lastCompleted === todayString) {
          // Remove today from completed dates
          const updatedCompletedDates = s.completedDates.filter(
            date => date !== todayString
          );
          
          return {
            ...s,
            count: Math.max(0, s.count - 1),
            lastCompleted: updatedCompletedDates.length > 0 
              ? updatedCompletedDates[updatedCompletedDates.length - 1] 
              : null,
            completedDates: updatedCompletedDates,
          };
        }
        return s;
      })
    );
  }

  // Delete streak handler
  function deleteStreak(id: number) {
    setStreaks((prev) => prev.filter((s) => s.id !== id));
    if (selectedStreakId === id) {
      setSelectedStreakId(null);
      setCurrentView("list");
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
        status: "completed",
        text: "Completed Today!",
        className: "status-completed",
        iconClass: "icon-completed",
      };
    }

    const yesterdayString = getYesterdayString();

    if (streak.count === 0) {
      return {
        status: "pending",
        text: "Ready to Start",
        className: "status-pending",
        iconClass: "icon-pending",
      };
    }

    if (streak.lastCompleted === yesterdayString) {
      return {
        status: "pending",
        text: "Pending Today",
        className: "status-pending",
        iconClass: "icon-pending",
      };
    }

    return {
      status: "missed",
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
      // Calculate diff in days ignoring time
      const daysDiff = Math.floor(
        (checkDate.getTime() - completedDate.getTime()) / (1000 * 3600 * 24)
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

  // Calculate longest streak length in days, and the streak should be continuous
  // i.e. no gaps in completed dates
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
        currentStreak = 1; // reset streak
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    return longestStreak;
  };

  // Get current week progress for a streak
  const getWeekProgress = (streak: Streak) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start of week
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(getDateString(date));
    }
    
    const completedSet = new Set(streak.completedDates);
    const completedThisWeek = weekDates.filter(date => completedSet.has(date));
    
    return {
      completed: completedThisWeek.length,
      total: weekDates.length,
      percentage: Math.round((completedThisWeek.length / weekDates.length) * 100)
    };
  };

  // Render contribution graph for a streak
  const renderContributionGraph = (streak: Streak) => {
    const today = new Date();
    const year = today.getFullYear();

    // Convert completed dates to set for quick lookup
    const completedSet = new Set(
      streak.completedDates.map((d) => new Date(d).toDateString())
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

    // Days count per month (leap year check for Feb)
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
      <div className="contribution-graph-vertical">
        <div className="grid-table">
          {/* Header Row */}
          <div className="grid-row grid-header">
            <div className="grid-month-label" /> {/* empty top-left */}
            {daysNumbers.map((dayNum) => (
              <div key={dayNum} className="grid-day-label">
                {dayNum}
              </div>
            ))}
          </div>

          {/* Month Rows */}
          {months.map((month, mIdx) => (
            <div className="grid-row" key={month}>
              {/* Sticky Month Label */}
              <div className="grid-month-label">{month}</div>

              {/* Day cells */}
              {daysNumbers.map((dayNum) => {
                if (dayNum > monthDays[mIdx]) {
                  return <div key={dayNum} className="grid-cell empty" />;
                }

                const cellDate = new Date(year, mIdx, dayNum);
                const cellString = cellDate.toDateString();
                const isFuture = cellDate > today;
                const isCompleted = completedSet.has(cellString);

                let title = "";
                let className = "grid-cell";

                if (isFuture) {
                  className += " cell-future";
                  title = `You have to complete this on ${dayNum} ${month}`;
                } else if (isCompleted) {
                  className += " cell-completed";
                  title = `Did it on ${dayNum} ${month}`;
                } else {
                  className += " cell-missed";
                  title = `Missed on ${dayNum} ${month}`;
                }

                return (
                  <div
                    key={dayNum}
                    className={className}
                    title={title}
                    style={{
                      fontSize: isCompleted ? "1.05em" : undefined,
                      textAlign: "center",
                    }}
                  >
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
  const selectedStreak = streaks.find(s => s.id === selectedStreakId) || null;

  // Render list view
 // Render list view
const renderListView = () => (
  <div className="container" role="main" aria-label="Streak management" style={{ padding: "30px" }}>
    {streaks.length === 0 ? (
      <div className="empty-state" aria-live="polite">
        <p>
          No streaks yet! Add your first streak above to get started. 🎯
        </p>
      </div>
    ) : (
      <section className="streaks-list" aria-label="List of streaks">
        {streaks.map((streak) => {
          const status = getStreakStatus(streak);
          const isCompletedToday = streak.lastCompleted === todayString;
          const weekProgress = getWeekProgress(streak);
          
          // Define chip styles based on status
          const chipStyles = {
            "completed": {
              backgroundColor: "#e8f5e9",
              color: "#2e7d32",
              border: "1px solid #c8e6c9"
            },
            "pending": {
              backgroundColor: "#fff3e0",
              color: "#ef6c00",
              border: "1px solid #ffe0b2"
            },
            "missed": {
              backgroundColor: "#ffebee",
              color: "#c62828",
              border: "1px solid #ffcdd2"
            }
          };
          
          const currentChipStyle = chipStyles[status.status] || chipStyles.pending;
          
          return (
            <article
              key={streak.id}
              className="streak-list-item"
              aria-live="polite"
              aria-atomic="true"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "15px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                marginBottom: "15px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <div 
                  style={{ 
                    fontSize: "2em", 
                    marginRight: "15px",
                    width: "50px",
                    textAlign: "center",
                    cursor: "pointer"
                  }}
                  onClick={() => handleStreakClick(streak.id)}
                >
                  {streak.emoji || "🔥"}
                </div>
                
                <div 
                  style={{ flex: 1, cursor: "pointer" }}
                  onClick={() => handleStreakClick(streak.id)}
                >
                  <div className="streak-title" style={{ 
                    fontSize: "1.2em", 
                    fontWeight: "bold",
                    marginBottom: "5px"
                  }}>
                    {streak.name}
                  </div>
                  
                  {/* Status Chip */}
                  <div 
                    className={`streak-status-chip ${status.className}`} 
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "16px",
                      fontSize: "0.65em",
                      fontWeight: "500",
                      ...currentChipStyle
                    }}
                  >
                    {status.text}
                  </div>
                </div>
                
                <div className="streak-count" style={{ 
                  fontSize: "1.5em", 
                  fontWeight: "bold",
                  color: "#ff6b35",
                  marginRight: "10px"
                }}>
                  {getCurrentStreak(streak)} 🔥
                </div>

                {!isCompletedToday && (
                  <button
                    className="complete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      completeStreak(streak.id);
                    }}
                    aria-label={`Complete streak ${streak.name} today`}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.9em"
                    }}
                  >
                    ✅ Done
                  </button>
                )}
              </div>

              {/* Weekly Progress Bar */}
              <div style={{ marginTop: "10px" }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  marginBottom: "5px",
                  fontSize: "0.85em",
                  color: "#666"
                }}>
                  <span>Week Progress: {weekProgress.completed}/{weekProgress.total}</span>
                  <span>{weekProgress.percentage}%</span>
                </div>
                <div style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "#e0e0e0",
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${weekProgress.percentage}%`,
                    height: "100%",
                    backgroundColor: weekProgress.percentage === 100 ? "#4CAF50" : 
                                    weekProgress.percentage >= 50 ? "#FF9800" : "#F44336",
                    transition: "width 0.3s ease"
                  }} />
                </div>
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
    const canComplete = !isCompletedToday;

    return (
      <div className="container" role="main" aria-label="Streak detail" style={{ padding: "30px" }}>
        <button 
          onClick={handleBackToList}
          style={{
            marginBottom: "20px",
            padding: "8px 16px",
            backgroundColor: "#f0f0f0",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          ← Back to List
        </button>
        
        <article className="streak-card" aria-live="polite" aria-atomic="true">
          <div className="streak-header">
            <div>
              <div className="streak-title">
                <span style={{ fontSize: "1.5em", marginRight: "10px" }}>
                  {selectedStreak.emoji || "🔥"}
                </span>
                {selectedStreak.name}
              </div>
              {selectedStreak.description && (
                <div className="streak-description" style={{ marginTop: "10px" }}>
                  {selectedStreak.description}
                </div>
              )}
            </div>

            <div
              className="streak-count"
              aria-label={`${getCurrentStreak(selectedStreak)} streak completions`}
              style={{ fontSize: "1.8em" }}
            >
              {getCurrentStreak(selectedStreak)} 🔥
            </div>
          </div>

          <div className="streak-progress">
            <div className="progress-header">
              <div className="progress-stats">
                <div className="progress-count">
                  {" "}
                  <div
                    className="green-rectangle"
                    style={{
                      width: "10px",
                      height: "10px",
                      backgroundColor: "green",
                      borderRadius: "3px",
                      display: "inline-block",
                      marginRight: "5px"
                    }}
                  ></div>{" "}
                  Total: {selectedStreak.count} days
                </div>
                <div className="progress-count">
                  {" "}
                  <div
                    className="orange-rectangle"
                    style={{
                      width: "10px",
                      height: "10px",
                      backgroundColor: "orange",
                      borderRadius: "3px",
                      display: "inline-block",
                      marginRight: "5px"
                    }}
                  ></div>{" "}
                  Longest: {getLongestStreak(selectedStreak)} days
                </div>
              </div>
            </div>
            {renderContributionGraph(selectedStreak)}
          </div>

          <div className="streak-dates">
            Started: {new Date(selectedStreak.createdDate).toLocaleDateString()}
            {selectedStreak.lastCompleted
              ? ` | Last completed: ${new Date(
                  selectedStreak.lastCompleted
                ).toLocaleDateString()}`
              : ""}
          </div>

          <div className="streak-footer">
            <div className={`streak-status ${status.className}`}>
              <span className={`status-icon ${status.iconClass}`} />
              {status.text}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {isCompletedToday ? (
                <button
                  className="uncomplete-btn"
                  onClick={() => uncompleteStreak(selectedStreak.id)}
                  aria-label={`Uncomplete streak ${selectedStreak.name} for today`}
                  style={{ backgroundColor: "#ffebee", color: "#c62828" }}
                >
                  ↩️ Undo Today
                </button>
              ) : (
                <button
                  className="complete-btn"
                  onClick={() => completeStreak(selectedStreak.id)}
                  disabled={!canComplete}
                  aria-label={
                    canComplete
                      ? `Complete streak ${selectedStreak.name} today`
                      : `Streak ${selectedStreak.name} completed today`
                  }
                >
                  ✅ Done
                </button>
              )}

              <button
                className="delete-btn"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete streak "${selectedStreak.name}"? This cannot be undone.`
                    )
                  ) {
                    deleteStreak(selectedStreak.id);
                  }
                }}
                aria-label={`Delete streak ${selectedStreak.name}`}
              >
                🗑️
              </button>
            </div>
          </div>
        </article>
      </div>
    );
  };

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
      />
      {currentView === "list" ? renderListView() : renderDetailView()}
    </>
  );
};

export default App;