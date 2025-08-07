import React, { useState, useEffect, type JSX } from 'react';

// Types for streak
export interface Streak {
  id: number;
  name: string;
  description?: string;
  count: number;
  createdDate: string; // stored as date string
  lastCompleted: string | null; // date string or null
  completedDates: string[]; // array of date strings
}

// Helper to get Indian formatted date string (without time)
const formatDateIN = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Helper to get date string for storage & comparison
const getDateString = (date: Date) => date.toDateString();

const todayString = getDateString(new Date());

const App: React.FC = () => {
  // Load streaks from localStorage or empty array
  const loadStreaks = (): Streak[] => {
    try {
      const saved = localStorage.getItem('streaks');
      if (!saved) return [];
      const parsed: Streak[] = JSON.parse(saved);
      return parsed;
    } catch {
      return [];
    }
  };

  // State
  const [streaks, setStreaks] = useState<Streak[]>(loadStreaks);
  const [currentDate, setCurrentDate] = useState(formatDateIN(new Date()));

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Save streaks to localStorage whenever streaks change
  useEffect(() => {
    localStorage.setItem('streaks', JSON.stringify(streaks));
  }, [streaks]);

  // Update date every hour
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(formatDateIN(new Date()));
    }, 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Add new streak handler
  function handleAddStreak(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const newStreak: Streak = {
      id: Date.now(),
      name: name.trim(),
      description: description.trim() || '',
      count: 0,
      createdDate: todayString,
      lastCompleted: null,
      completedDates: [],
    };

    setStreaks((prev) => [...prev, newStreak]);
    setName('');
    setDescription('');
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
      return { status: 'completed', text: 'Completed Today!', className: 'status-completed', iconClass: 'icon-completed' };
    }

    const yesterdayString = getYesterdayString();

    if (streak.count === 0) {
      return { status: 'pending', text: 'Ready to Start', className: 'status-pending', iconClass: 'icon-pending' };
    }

    if (streak.lastCompleted === yesterdayString) {
      return { status: 'pending', text: 'Pending Today', className: 'status-pending', iconClass: 'icon-pending' };
    }

    return { status: 'missed', text: 'Missed Yesterday', className: 'status-missed', iconClass: 'icon-missed' };
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
      const daysDiff = Math.floor((checkDate.getTime() - completedDate.getTime()) / (1000 * 3600 * 24));
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

  // Render contribution graph for a streak
  const renderContributionGraph = (streak: Streak) => {
    const today = new Date();
    const startDate = new Date(today);
    // 53 weeks ago + adjustment for week start (Sunday)
    startDate.setDate(today.getDate() - (53 * 7) + (7 - today.getDay()));

    const completedSet = new Set(streak.completedDates.map((d) => new Date(d).toDateString()));

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const cells: JSX.Element[] = [];
    for (let week = 0; week < 53; week++) {
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + week * 7 + day);

        const isCompleted = completedSet.has(currentDate.toDateString());
        const isFuture = currentDate > today;
        const isBeforeCreation = currentDate < new Date(streak.createdDate);

        let className = 'day-cell';
        let title = currentDate.toDateString();

        if (isFuture || isBeforeCreation) {
          className += ' future';
          title = `${title} - Not applicable`;
        } else if (isCompleted) {
          className += ' completed level-4';
          title += ' - Completed!';
        } else {
          title += ' - No activity';
        }

        cells.push(<div key={`${week}-${day}`} className={className} title={title} />);
      }
    }

    return (
      <div className="contribution-graph">
        <div className="weekdays">
          {weekdays.map((day, i) => (i % 2 === 1 ? <div key={day}>{day}</div> : <div key={day}></div>))}
        </div>
        <div className="months-container">
          <div className="months">{months.map((m) => <div key={m}>{m}</div>)}</div>
          <div className="days-grid">{cells}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <header className="header" aria-label="App header">
        <h1>🔥 Streak.it</h1>
        <p>Build consistency, one day at a time</p>
      </header>

      <section className="current-date" aria-live="polite" aria-atomic="true">
        📅 Today is {currentDate}
      </section>

      <section className="add-streak-form" aria-labelledby="addStreakTitle">
        <h2 id="addStreakTitle" style={{ marginBottom: '20px', color: '#000', fontWeight: 600, fontSize: '1.125rem' }}>
          Add New Streak
        </h2>
        <form onSubmit={handleAddStreak} noValidate>
          <div className="form-group">
            <label htmlFor="streakName">Streak Name</label>
            <input
              id="streakName"
              type="text"
              placeholder="e.g., Morning Workout, Read 30 minutes, Meditate"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="streakDescription">Description (Optional)</label>
            <textarea
              id="streakDescription"
              placeholder="Describe your streak goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn" aria-label="Start new streak">
            🚀 Start Streak
          </button>
        </form>
      </section>

      {streaks.length === 0 ? (
        <div className="empty-state" aria-live="polite">
          <p>No streaks yet! Add your first streak above to get started. 🎯</p>
        </div>
      ) : (
        <section className="streaks-container" aria-label="List of streaks">
          {streaks.map((streak) => {
            const status = getStreakStatus(streak);
            const canComplete = streak.lastCompleted !== todayString;

            return (
              <article key={streak.id} className="streak-card" aria-live="polite" aria-atomic="true">
                <div className="streak-header">
                  <div>
                    <div className="streak-title">{streak.name}</div>
                    {streak.description && <div className="streak-description">{streak.description}</div>}
                  </div>

                  <div className="streak-count" aria-label={`${streak.count} streak completions`}>
                    {streak.count} 🔥
                  </div>
                </div>

                <div className="streak-progress">
                  <div className="progress-header">
                    <div className="progress-title">{streak.completedDates.length} contributions in the last year</div>
                    <div className="progress-stats">Current streak: {getCurrentStreak(streak)} days</div>
                  </div>
                  {renderContributionGraph(streak)}
                </div>

                <div className="streak-dates">
                  Started: {new Date(streak.createdDate).toLocaleDateString()}
                  {streak.lastCompleted ? ` | Last completed: ${new Date(streak.lastCompleted).toLocaleDateString()}` : ''}
                </div>

                <div className="streak-footer">
                  <div className={`streak-status ${status.className}`}>
                    <span className={`status-icon ${status.iconClass}`} />
                    {status.text}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="complete-btn"
                      onClick={() => completeStreak(streak.id)}
                      disabled={!canComplete}
                      aria-label={canComplete ? `Complete streak ${streak.name} today` : `Streak ${streak.name} completed today`}
                    >
                      {canComplete ? '✅ Complete Today' : '✅ Completed'}
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => {
                        if (window.confirm(`Delete streak "${streak.name}"? This cannot be undone.`)) {
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
  );
};

export default App;
