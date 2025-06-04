import React from "react";
import "./Toast.css";

const Toast = ({ message, onClose }) => (
  <div className="custom-toast">
    {message}
    <button className="toast-close-btn" onClick={onClose}>&times;</button>
  </div>
);

export default Toast;
