import React, { useEffect, useState } from "react";
import "./Recommendation.css";

const Recommendation = ({ isFullPage, user }) => {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionId = localStorage.getItem("news_session_id") || "no_session";

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
      },
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

  // TRACKING FUNKCIJA - Klik na recommended članak
  const handleRecommendationClick = async (article, category) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/analytics/track`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "recommendation_click",
          article_id: article.url || article._id,
          article_title: article.title,
          recommended_category: category,
          source: "recommendation_widget",
          session_id: sessionId || "no_session", 
          flow_type: "recommendation",
          page: window.location.pathname,
          user_id: user?.id || user?.sub || "anonymous", // ← Koristi user prop
          device: window.innerWidth < 768 ? "mobile" : "desktop",
          timestamp: new Date().toISOString(),
        }),
      });
      console.log(`[Analytics] Tracked recommendation click: ${article.title}`);
    } catch (err) {
      console.error("Error tracking recommendation click:", err);
    }

    // Otvori članak u novom tabu
    window.open(article.url, "_blank", "noopener,noreferrer");
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
            onClick={() =>
              handleRecommendationClick(
                item,
                item.category || recs.recommended_category,
              )
            } // ← DODAJTE onClick
          >
            <div className="match-tag">{getMatchScore(i)}% Match</div>
            <div className="rec-card-content">
              <span className="category-badge">
                {item.category || recs.recommended_category || "Preporuka"}
              </span>
              <h3>{item.title}</h3>
              <p>
                {item.description?.substring(0, 100) ||
                  "Read this interesting article..."}
                ...
              </p>
              <div className="rec-footer">
                <button
                  className="read-more-modern"
                  onClick={(e) => {
                    e.stopPropagation(); // Spriječi dupli klik
                    handleRecommendationClick(
                      item,
                      item.category || recs.recommended_category,
                    );
                  }}
                >
                  Read Article <span>→</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendation;
