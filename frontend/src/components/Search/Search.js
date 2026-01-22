import React, { useRef, useEffect } from "react";
import { FiRefreshCcw, FiX } from "react-icons/fi";
import "./Search.css";

const Search = ({
  value,
  onInputChange,
  onSearch,
  onRefresh,
  loading,
  refreshing,
  placeholder = "Search articles...",
  onClear,
  autoFocus = false,
  user,
}) => {
  const inputRef = useRef(null);
  const sessionId = localStorage.getItem("news_session_id") || "no_session";

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [value, autoFocus]);

  // 1. TRACKING ZA SEARCH
  const handleSearchWithTracking = async () => {
    if (onSearch) {
      onSearch(); // Originalna funkcija

      // Tracking samo ako ima upita
      if (value.trim()) {
        try {
          await fetch(`${process.env.REACT_APP_API_URL}/analytics/track`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "search_used",
              search_query: value,
              page: window.location.pathname,
              session_id: sessionId || "no_session",
              flow_type: "search",
              user_id: user?.id || user?.sub || "anonymous",
              device: window.innerWidth < 768 ? "mobile" : "desktop",
              timestamp: new Date().toISOString(),
            }),
          });
          console.log(`[Analytics] Tracked search: ${value}`);
        } catch (err) {
          console.error("Error tracking search:", err);
        }
      }
    }
  };

  // 2. TRACKING ZA REFRESH
  const handleRefreshWithTracking = async () => {
    if (onRefresh) {
      onRefresh(); // Originalna funkcija

      try {
        await fetch(`${process.env.REACT_APP_API_URL}/analytics/track`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "refresh_clicked",
            page: window.location.pathname,
            user_id: user?.id || user?.sub || "anonymous",
            device: window.innerWidth < 768 ? "mobile" : "desktop",
            timestamp: new Date().toISOString(),
          }),
        });
        console.log("[Analytics] Tracked refresh");
      } catch (err) {
        console.error("Error tracking refresh:", err);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearch) {
      handleSearchWithTracking(); // Koristite tracking verziju
    }
  };

  return (
    <div className="search-container">
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={onInputChange}
        onKeyDown={handleKeyDown}
        disabled={loading || refreshing}
        autoFocus={autoFocus}
      />
      {value && (
        <button
          className="clear-btn"
          title="Clear"
          onClick={onClear}
          type="button"
          tabIndex={-1}
        >
          <FiX size={20} />
        </button>
      )}
      <button
        className="refresh-btn"
        title="Refresh"
        onClick={handleRefreshWithTracking} // Koristite tracking verziju
        disabled={refreshing || loading}
        type="button"
      >
        <FiRefreshCcw
          size={20}
          style={{
            animation: refreshing ? "spin 1s linear infinite" : "none",
          }}
        />
      </button>
    </div>
  );
};

export default Search;
