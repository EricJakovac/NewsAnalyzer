import React, { useEffect, useState } from "react";
import "./Recommendation.css";

const Recommendation = ({ isFullPage }) => {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id || user?.sub;

    if (!userId) {
      setLoading(false);
      return;
    }

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

  // Pomoćna funkcija za generiranje nasumičnog % podudaranja (za UX dojam)
  const getMatchScore = (index) => {
    // Prva preporuka je uvijek najjača
    return 99 - index * 2 - Math.floor(Math.random() * 3);
  };

  if (loading) {
    return (
      <div className="recommendation-container">
        <div className="rec-header skeleton-pulse">
          <div className="skeleton-title"></div>
          <div className="skeleton-subtitle"></div>
        </div>
        <div className="rec-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rec-card-premium skeleton-card">
              <div className="skeleton-content">
                <div className="skeleton-line category"></div>
                <div className="skeleton-line title"></div>
                <div className="skeleton-line text"></div>
                <div className="skeleton-line button"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recs || !recs.items || recs.items.length === 0) {
    return (
      <div className="no-data">
        <p>Start reading news to get personalized recommendations!</p>
      </div>
    );
  }

  return (
    <div
      className={`recommendation-container ${isFullPage ? "full-page" : ""}`}
    >
      <div className="rec-header">
        <div className="sparkle-icon">✨</div>
        <h2>Personalized for you</h2>
        <p className="explanation-text">{recs.explanation}</p>
      </div>

      <div className="rec-grid">
        {recs.items.map((item, i) => (
          <div
            key={i}
            className="rec-card-premium"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="match-tag">{getMatchScore(i)}% Match</div>
            <div className="rec-card-content">
              <span className="category-badge">
                {item.category || "Preporuka"}
              </span>
              <h3>{item.title}</h3>
              <p>{item.description?.substring(0, 100)}...</p>
              <div className="rec-footer">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="read-more-modern"
                >
                  Read Article <span>→</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendation;
