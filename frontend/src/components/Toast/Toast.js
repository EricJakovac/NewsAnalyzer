import React, { useEffect } from "react";
import "./Toast.css";

const Toast = ({ message, type = "info", onClose }) => {
  
  // Automatsko zatvaranje nakon 5 sekundi (usklađeno s CSS animacijom)
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`custom-toast ${type}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close-btn" onClick={onClose}>&times;</button>
    </div>
  );
};

export default Toast;