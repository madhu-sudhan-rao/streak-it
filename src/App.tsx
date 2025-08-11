import React, { useEffect, useState } from "react";
import Header from "./components/Header/Header";
import type { Streak } from "./models/streak.model";

// Helper to get date string for storage & comparison
const getDateString = (date: Date) => date.toDateString();

const todayString = getDateString(new Date());

const App: React.FC = () => {
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

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // const [selectedCellInfoByStreak, setSelectedCellInfoByStreak] = React.useState<Record<number, string>>({});
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

  // Delete streak handler
  function deleteStreak(id: number) {
    setStreaks((prev) => prev.filter((s) => s.id !== id));
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




  // Render contribution graph for a streak
  const renderContributionGraph = (streak: Streak) => {
    const today = new Date();
    const year = today.getFullYear();

    // Convert completed dates to set for quick lookup
    const completedSet = new Set(
      streak.completedDates.map(d => new Date(d).toDateString())
    );

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Days count per month (leap year check for Feb)
    const monthDays = [
      31,
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28,
      31, 30, 31, 30,
      31, 31, 30, 31, 30, 31
    ];

    const daysNumbers = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
      <div className="contribution-graph-vertical">
        <div className="grid-table">
          {/* Header Row */}
          <div className="grid-row grid-header">
            <div className="grid-month-label" /> {/* empty top-left */}
            {daysNumbers.map(dayNum => (
              <div key={dayNum} className="grid-day-label">{dayNum}</div>
            ))}
          </div>

          {/* Month Rows */}
          {months.map((month, mIdx) => (
            <div className="grid-row" key={month}>
              {/* Sticky Month Label */}
              <div className="grid-month-label">{month}</div>
              
              {/* Day cells */}
              {daysNumbers.map(dayNum => {
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
                      textAlign: "center"
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

  return (
    <>
      <Header handleAddStreak={handleAddStreak} name={name}  setName={setName} description={description} setDescription={setDescription} emoji={emoji} setEmoji={setEmoji}/>
      <div
        className="container"
        role="main"
        aria-label="Streak management"
        style={{ padding: "30px" }}
      >
 

        {streaks.length === 0 ? (
          <div className="empty-state" aria-live="polite">
            <p>
              No streaks yet! Add your first streak above to get started. 🎯
            </p>
          </div>
        ) : (
          <section className="streaks-container" aria-label="List of streaks">
            {streaks.map((streak) => {
              const status = getStreakStatus(streak);
              const canComplete = streak.lastCompleted !== todayString;

              return (
                <article
                  key={streak.id}
                  className="streak-card"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <div className="streak-header">
                    <div>
                      {/* <div className="streak-title">{streak.name}</div> */}
                      <div className="streak-title">
                        <span style={{ fontSize: "1.2em", marginRight: "6px" }}>
                          {streak.emoji || "🔥"}
                        </span>
                        {streak.name}
                      </div>
                      {/* {streak.description && <div className="streak-description">{streak.description}</div>} */}
                      {/* {selectedCellInfoByStreak[streak.id] && (
                        <div className="streak-description">
                          {selectedCellInfoByStreak[streak.id]}
                        </div>
                      )} */}
                    </div>

                    <div
                      className="streak-count"
                      aria-label={`${getCurrentStreak(
                        streak
                      )} streak completions`}
                    >
                      {getCurrentStreak(streak)} 🔥
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
                            }}
                          ></div>{" "}
                          Total: {streak.count} days
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
                            }}
                          ></div>{" "}
                          Longest: {getLongestStreak(streak)} days
                        </div>
                      </div>
                    </div>
                    {renderContributionGraph(streak)}
                  </div>

                  <div className="streak-dates">
                    Started: {new Date(streak.createdDate).toLocaleDateString()}
                    {streak.lastCompleted
                      ? ` | Last completed: ${new Date(
                          streak.lastCompleted
                        ).toLocaleDateString()}`
                      : ""}
                  </div>

                  <div className="streak-footer">
                    <div className={`streak-status ${status.className}`}>
                      <span className={`status-icon ${status.iconClass}`} />
                      {status.text}
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        className="complete-btn"
                        onClick={() => completeStreak(streak.id)}
                        disabled={!canComplete}
                        aria-label={
                          canComplete
                            ? `Complete streak ${streak.name} today`
                            : `Streak ${streak.name} completed today`
                        }
                      >
                        {canComplete ? "✅ Complete Today" : "✅ Completed"}
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete streak "${streak.name}"? This cannot be undone.`
                            )
                          ) {
                            deleteStreak(streak.id);
                          }
                        }}
                        aria-label={`Delete streak ${streak.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </>
  );
};

export default App;
