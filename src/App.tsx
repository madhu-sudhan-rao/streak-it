import React, { useEffect, useState, type JSX } from 'react';
import EmojiInput from './components/EmojiInput/EmojiInput';
import Header from './components/Header/Header';
import type { Streak } from './models/streak.model';

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

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCellInfoByStreak, setSelectedCellInfoByStreak] = React.useState<Record<number, string>>({});
  const [emoji, setEmoji] = useState<string | undefined>('🔥');

  // Save streaks to localStorage whenever streaks change
  useEffect(() => {
    localStorage.setItem('streaks', JSON.stringify(streaks));
  }, [streaks]);


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
      emoji: emoji || '🔥',   // Set chosen emoji
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
      const diff = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 3600 * 24);
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
    const startOfYear = new Date(today.getFullYear(), 0, 1); // January 1st of current year

    // Calculate how many days to go back to previous Sunday (week starts on Sunday)
    const dayOfWeek = startOfYear.getDay(); // 0=Sunday, 1=Monday,... 6=Saturday
    const diffToSunday = dayOfWeek; // If Jan 1 is Sunday, diffToSunday=0; else days back to Sunday

    const startDate = new Date(startOfYear);
    startDate.setDate(startOfYear.getDate() - diffToSunday);

    const completedSet = new Set(streak.completedDates.map((d) => new Date(d).toDateString()));

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const cells: JSX.Element[] = [];
    for (let day = 0; day < 7; day++) {
      for (let week = 0; week < 53; week++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + week * 7 + day);

        const isCompleted = completedSet.has(currentDate.toDateString());
        const isFuture = currentDate > today;
        const isBeforeYearStart = currentDate < startOfYear;

        let className = 'day-cell';
        let title = currentDate.toDateString();

        if (isFuture || isBeforeYearStart) {
          className += ' future';
          title = `You have to complete this on ${currentDate.getDate()} ${months[currentDate.getMonth()]}`;
          cells.push(<div key={`${week}-${day}`} className={className} title={title} />)
        } else if (isCompleted) {
          
          cells.push(
            <div
              key={`${week}-${day}`}
              className={`${className} completed`}
              title={title}
            >
              <div className='completed completed-emoji' title={title} style={{ fontSize: '7px', textAlign: 'center' }}  >
                {streak.emoji || '🔥'}
              </div>
            </div>
          );
          title = `Did it on ${currentDate.getDate()} ${months[currentDate.getMonth()]}`;
        } else {
          
          cells.push(
            <div key={`${week}-${day}`} className={className} title={title} />
          );
          title = `Missed on ${currentDate.getDate()} ${months[currentDate.getMonth()]}`;
        }

      }
    }

    const onCellClick = (e: React.MouseEvent<HTMLDivElement>, streak: Streak) => {
      const target = e.target as HTMLDivElement;
      console.log("🚀 ~ onCellClick ~ target:", target)

      if (!target || !target.title) return;

      // Split title by spaces
      const parts = target.title.split(' ');

      // Safely get the last 2 words
      if (parts.length < 2) {
        console.warn('Title does not have enough parts to extract date');
        return;
      }

      const datePart = parts.slice(-2).join(' '); // Join last two parts to get date

      if (datePart) {
        let infoString = '';
        // if target has completed className, then set text to Did it on datePart
        if (target.className.includes('completed')) {
          infoString = `Did it on ${datePart}`;


        } else if (target.className.includes('future')) {
          infoString = `You have to complete this on ${datePart}`;
        } else {
          // if target has missed className, then set text to Missed on datePart
          infoString = `Missed on ${datePart}`;
        }

        setSelectedCellInfoByStreak(prev => ({
          ...prev,
          [streak.id]: infoString,  // e.g. 'Did it on ...'
        }));
        
      } else {
        console.warn('Date part not found in title attribute');
      }

    };


    return (
      <div className="contribution-graph">
        <div className="weekdays">
          {weekdays.map((day) =><div key={day}>{day}</div>)}
        </div>
        <div className="months-container">
          <div className="months">{months.map((m) => <div key={m}>{m}</div>)}</div>
          <div className="days-grid" onClick={(e) => onCellClick(e, streak)}  >{cells}</div>
        </div>
      </div>
    );
  };

  return (
      <>
        <Header />
        <div className="container" role="main" aria-label="Streak management" style={{ padding: '30px' }}>  
          <section className="add-streak-form" aria-labelledby="addStreakTitle">
            <h2 id="addStreakTitle" style={{ marginBottom: '20px', color: '#000', fontWeight: 600, fontSize: '1.125rem' }}>
              Add New Streak
            </h2>
            <form onSubmit={handleAddStreak} noValidate>
              <div className='form-row'>
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
                  <label htmlFor="streakEmoji">Emoji</label>
                  <EmojiInput value={emoji} onChange={setEmoji} />
                </div>
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
                      <div >
                        {/* <div className="streak-title">{streak.name}</div> */}
                        <div className="streak-title">
                          <span style={{ fontSize: '1.2em', marginRight: '6px' }}>{streak.emoji || '🔥'}</span>
                          {streak.name}
                        </div>
                        {/* {streak.description && <div className="streak-description">{streak.description}</div>} */}
                        {selectedCellInfoByStreak[streak.id] && (
                          <div className="streak-description">{selectedCellInfoByStreak[streak.id]}</div>
                        )}
                      </div>
    
                      <div className="streak-count" aria-label={`${getCurrentStreak(streak)} streak completions`}>
                        {getCurrentStreak(streak)} 🔥
                      </div>
                    </div>
    
                    <div className="streak-progress">
                      <div className="progress-header">
                        <div className="progress-title">{streak.completedDates.length} contributions in the last year</div>
                        <div className='progress-stats'>
                          <div className="progress-count"> <div className='green-rectangle' style={{ width: '10px', height: '10px', backgroundColor: 'green', borderRadius: '3px' }}></div>  Total: {streak.count} days</div>
                          <div className="progress-count"> <div className='orange-rectangle' style={{ width: '10px', height: '10px', backgroundColor: 'orange', borderRadius: '3px' }}></div>  Longest: {getLongestStreak(streak)} days</div>
                        </div>
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
      </>
  );
};

export default App;
