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
import { supabase } from "../../lib/supabaseClient";

// Define the props for the Header component
interface HeaderProps {
  handleAddStreak: (e: FormEvent<Element>) => void;
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  emoji: string | undefined;
  setEmoji: (emoji: string) => void;
  user: any;
}

const Header: React.FC<HeaderProps> = ({
  handleAddStreak,
  name,
  setName,
  description,
  setDescription,
  emoji,
  setEmoji,
  user,
}) => {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function onSubmit(e: FormEvent<Element>) {
    e.preventDefault();
    handleAddStreak(e);
    setOpen(false); // close after adding
  }

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setSigningOut(false);
    }
  };

  const userEmail = user?.email || "";
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split("@")[0];
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <nav className="streakit-navbar">
      <div className="nav-left">
        <h1>🔥 Habits</h1>
      </div>

      <div className="nav-right">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="add-streak">
              Add Habit
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
                    <label htmlFor="streakName">Habit Name</label>
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

        {user && (
          <div className="user-profile">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="user-avatar" referrerPolicy="no-referrer" />
            ) : (
              <div className="user-avatar-fallback">{userName.charAt(0).toUpperCase()}</div>
            )}
            <span className="user-name" title={userEmail}>{userName}</span>
            <button className="btn-logout" onClick={handleSignOut} disabled={signingOut} title="Sign Out">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="logout-icon">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;

