import React, { useState } from "react";
import "./Cards.css";

const Cards = ({ data = [] }) => {
  const [activeArticle, setActiveArticle] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getSource = (article) => article?.source?.name || "Unknown";

  const handleSeeMore = (item) => {
    setActiveArticle(item);
  };

  const closePopup = () => {
    setActiveArticle(null);
  };

  return (
    <>
      <div className="cards-wrapper">
        {data.map((item, index) => (
          <article key={item.url || index} className="article-card">
            <header className="article-card-header">
              <span className="article-card-index">#{index + 1}</span>
              <h3 className="article-card-title">
                {item.title || "Untitled article"}
              </h3>
            </header>

            <div className="article-card-divider" />

            <div className="article-card-body">
              <div className="article-card-field">
                <span className="label">Source</span>
                <span className="value">{getSource(item)}</span>
              </div>
              <div className="article-card-field">
                <span className="label">Author</span>
                <span className="value">{item.author || "Unknown"}</span>
              </div>
              <div className="article-card-field">
                <span className="label">Date</span>
                <span className="value">
                  {formatDate(item.publishedAt || item.date)}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="article-card-link"
              onClick={() => handleSeeMore(item)}
            >
              Read more
            </button>
          </article>
        ))}
      </div>

      {activeArticle && (
        <div className="card-summary-overlay" onClick={closePopup}>
          <div
            className="card-summary-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-summary-header">
              <h3>Article Details</h3>
              <button
                type="button"
                className="card-summary-close"
                onClick={closePopup}
              >
                ×
              </button>
            </div>

            <div className="card-summary-content">
              <div className="card-summary-field">
                <strong>Title:</strong>
                <p>{activeArticle.title}</p>
              </div>

              <div className="card-summary-field">
                <strong>Category:</strong>
                <span className="category-tag">
                  {activeArticle.category || "general"}
                </span>
              </div>

              <div className="card-summary-field">
                <strong>Description:</strong>
                <p>
                  {activeArticle.description || "No description available"}
                </p>
              </div>

              <div className="card-summary-field">
                <strong>Published:</strong>
                <p>
                  {formatDate(activeArticle.publishedAt || activeArticle.date)}
                </p>
              </div>

              <div className="card-summary-field">
                <strong>Source:</strong>
                {activeArticle.url ? (
                  <a
                    href={activeArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link"
                  >
                    Read Full Article →
                  </a>
                ) : (
                  <p>Read Full Article →</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Cards;
