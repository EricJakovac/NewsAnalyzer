import React, { useRef, useEffect } from "react";
import { FiRefreshCcw, FiX } from "react-icons/fi";
import "./Search.css";

const Search = ({
  value,
  onInputChange,
  onSearch,      // <-- new prop
  onRefresh,
  loading,
  refreshing,
  placeholder = "Search articles...",
  onClear,
  autoFocus = false,
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [value, autoFocus]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearch) {
      onSearch();
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
        onKeyDown={handleKeyDown}    // <-- add this
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
        onClick={onRefresh}
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
