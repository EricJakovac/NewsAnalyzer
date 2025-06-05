import React from "react";
import "./Toast.css";

const Toast = ({ message, type = "info", onClose }) => (
  <div className={`custom-toast ${type}`}>
    {message}
    <button className="toast-close-btn" onClick={onClose}>&times;</button>
  </div>
);
export default Toast;
