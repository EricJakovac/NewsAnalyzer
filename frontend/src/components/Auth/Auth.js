import React from "react";
import { FcGoogle } from "react-icons/fc";

// Dodajemo 'user' i 'onLogout' kao propse
const Auth = ({ user, onLogout }) => {
  const handleGoogleLogin = () => {
    // Backend OAuth endpoint
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/login`;
  };

  return (
    <div className="auth-container">
      {/* 1. AKO KORISNIK NIJE ULOGIRAN - Pokaži Login opciju */}
      {!user ? (
        <>
          <h2>Connect your Google Analytics account</h2>
          <p>
            To view analytics data, please sign in with your Google account and
            allow access to Google Analytics.
          </p>

          <button className="google-login-btn" onClick={handleGoogleLogin}>
            <FcGoogle size={20} />
            <span style={{ paddingTop: '1px' }}>Sign in with Google</span>
          </button>
        </>
      ) : (
        /* 2. AKO JE KORISNIK ULOGIRAN - Pokaži njegove podatke i Logout */
        <div className="user-logged-in">
          <h2>Connected to Google</h2>
          <div
            className="user-info-card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              margin: "20px 0",
              padding: "15px",
              background: "#f4f4f4",
              borderRadius: "8px",
            }}
          >
            {user.picture && (
              <img
                src={user.picture}
                alt="Profile"
                style={{ borderRadius: "50%", width: "50px" }}
              />
            )}
            <div>
              <p style={{ margin: 0, fontWeight: "bold" }}>{user.name}</p>
              <p style={{ margin: 0, fontSize: "0.9em", color: "#666" }}>
                {user.email}
              </p>
            </div>
          </div>

          <p>You are successfully connected to Google Analytics.</p>

          <button
            className="logout-btn"
            onClick={onLogout}
            style={{
              backgroundColor: "#ff4d4d",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Disconnect Account
          </button>
        </div>
      )}
    </div>
  );
};

export default Auth;
