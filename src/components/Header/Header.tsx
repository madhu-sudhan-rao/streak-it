import React, { useState, type FormEvent } from "react";
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
  handleAddStreak: (e: FormEvent<Element>) => void;
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  emoji: string | undefined;
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
}) => {
  const [open, setOpen] = useState(false);

  function onSubmit(e: FormEvent<Element>) {
    e.preventDefault();
    handleAddStreak(e);
    setOpen(false); // close after adding
  }

  return (
    <nav className="streakit-navbar">
      <div className="nav-left">
        <h1>🔥 Streak.it</h1>
      </div>

      <div className="add-streak-button">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="add-streak">
              Add Streak
            </Button>
          </DialogTrigger>

          <DialogContent>
            <section className="add-streak-form" aria-labelledby="addStreakTitle">
              <h2 id="addStreakTitle" className="dialog-title">
                Add New Streak
              </h2>

              <form onSubmit={onSubmit} noValidate style={{paddingBottom: "20px"}}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="streakName">Streak Name</label>
                    <input
                      id="streakName"
                      type="text"
                      placeholder="e.g., Morning Workout"
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

                <DialogFooter>
                  <button type="submit" className="btn" aria-label="Start new streak">
                    🚀 Start Streak
                  </button>
                </DialogFooter>
              </form>
            </section>
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  );
};

export default Header;
