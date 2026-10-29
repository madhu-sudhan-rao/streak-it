import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./Login.css";

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-glow-blob login-glow-1"></div>
      <div className="login-glow-blob login-glow-2"></div>
      
      <div className="login-card animate-fade-in">
        <div className="login-brand">
          <span className="login-logo-emoji">🔥</span>
          <h1 className="login-title">Streak-It</h1>
        </div>
        <p className="login-subtitle">
          Track your daily habits, build long-lasting streaks, and achieve your goals.
        </p>

        {error && <div className="login-error-message">{error}</div>}

        <button 
          className="google-btn" 
          onClick={handleGoogleLogin} 
          disabled={loading}
        >
          {loading ? (
            <span className="login-spinner"></span>
          ) : (
            <>
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.12h4.02c2.37-2.17 3.74-5.39 3.74-8.74z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-4.02-3.12c-1.12.75-2.55 1.19-3.91 1.19-3.02 0-5.58-2.03-6.49-4.76H1.36v3.22C3.33 21.67 7.42 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.51 14.4c-.23-.7-.36-1.45-.36-2.22s.13-1.52.36-2.22V6.74H1.36A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.36 5.36l4.15-3.21.08-.76z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.42 0 3.33 2.33 1.36 6.74l4.15 3.22c.91-2.73 3.47-4.76 6.49-4.76z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
        
        <div className="login-footer">
          Only signed in users can view and track their habit streaks.
        </div>
      </div>
    </div>
  );
};

export default Login;
