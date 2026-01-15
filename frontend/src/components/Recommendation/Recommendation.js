import React, { useEffect, useState } from "react";

const Recommendation = ({ userId }) => {
  const [recs, setRecs] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetch(`${API_BASE_URL}/analytics/recommendations`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          console.error(`Recommendation fetch failed with status ${res.status}`);
          throw new Error("Not logged in or no data");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Recommendations data received:", data);
        setRecs(data);
      })
      .catch((err) => console.error("Recommendation error:", err));
  }, [API_BASE_URL]);

  if (!recs || !recs.items || recs.items.length === 0) return null;

  return (
    <div className="recommendation-card">
      <div className="rec-header">
        <h4>✨ Recommended for you</h4>
        <p>{recs.explanation}</p>
      </div>
      <div className="rec-grid">
        {recs.items.map((item, i) => (
          <div key={i} className="rec-item">
            <a href={item.url} target="_blank" rel="noreferrer">
              {item.title.substring(0, 60)}...
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendation;
