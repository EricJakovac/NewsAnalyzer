import React, { useEffect, useState } from "react";
import "./Recommendation.css";

const Recommendation = ({ isFullPage }) => {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pročitaj user_id iz localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id || user?.sub;

    if (!userId) {
      setLoading(false);
      return;
    }

    // Prosljeđi user_id kao query parametar
    fetch(
      `${process.env.REACT_APP_API_URL}/analytics/recommendations?user_id=${userId}`,
      {
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setRecs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading your personalized news...</div>;
  if (!recs || !recs.items || recs.items.length === 0) {
    return (
      <div className="no-data">
        <p>Start reading news to get personalized recommendations!</p>
      </div>
    );
  }

  return (
    <div className={`recommendation-container ${isFullPage ? "full-page" : ""}`}>
      <div className="rec-header">
        <h2>✨ Personalized for you</h2>
        <p className="explanation-text">{recs.explanation}</p>
      </div>

      <div className="rec-grid">
        {recs.items.map((item, i) => (
          <div key={i} className="rec-card-large">
            <div className="rec-card-content">
              <h3>{item.title}</h3>
              <p>{item.description?.substring(0, 120)}...</p>
              <a href={item.url} target="_blank" rel="noreferrer" className="read-more">
                Read Article →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendation;