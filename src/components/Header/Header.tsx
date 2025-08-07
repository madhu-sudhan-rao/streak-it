import React from "react";
import "./Header.css"; 

const Header: React.FC = () => {
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
    const timer = setInterval(() => setCurrentDate(getCurrentDateString()), 3600000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="streakit-navbar">
      <div className="nav-left">
        <h1>🔥 Streak.it</h1>
      </div>
      <div className="nav-date">{currentDate}</div>

  
    </nav>
  );
};

export default Header;
