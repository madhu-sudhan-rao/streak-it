import React from "react";
import "./Header.css";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import EmojiInput from "../EmojiInput/EmojiInput";

// Define the props for the Header component
interface HeaderProps {
  handleAddStreak: () => void;
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  emoji: string;
  setEmoji: (emoji: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  handleAddStreak,
  name,
  setName,
  description,
  setDescription,
  emoji,
  setEmoji,
}: HeaderProps) => {
  // Format date in Indian locale, e.g. "7 August 2025"
  const getCurrentDateString = () => {
    const now = new Date();
    return now.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const [currentDate, setCurrentDate] = React.useState(getCurrentDateString());

  React.useEffect(() => {
    // Update every hour (date change is rare)
    const timer = setInterval(
      () => setCurrentDate(getCurrentDateString()),
      3600000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="streakit-navbar">
      <div className="nav-left">
        <h1>🔥 Streak.it</h1>
      </div>
      {/* <div className="nav-date">{currentDate}</div> */}
      <div className="add-streak-button">
        <Dialog>
          <DialogTrigger className="add-streak-trigger" asChild>
            <Button variant="outline" size="icon" className="add-streak">
              Add Streak
            </Button>
          </DialogTrigger>
          <DialogContent>
            <section
              className="add-streak-form"
              aria-labelledby="addStreakTitle"
            >
              <h2
                id="addStreakTitle"
                style={{
                  marginBottom: "20px",
                  color: "#000",
                  fontWeight: 600,
                  fontSize: "1.125rem",
                }}
              >
                Add New Streak
              </h2>
              <form onSubmit={handleAddStreak} noValidate>
                <div className="form-row">
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
                  <label htmlFor="streakDescription">
                    Description (Optional)
                  </label>
                  <textarea
                    id="streakDescription"
                    placeholder="Describe your streak goal..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </form>
            </section>
          <DialogFooter className="dialog-footer">
            <button type="submit" className="btn" aria-label="Start new streak">
              🚀 Start Streak
            </button>
          </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  );
};

export default Header;
