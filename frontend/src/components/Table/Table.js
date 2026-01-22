import React from "react";
import { GoEye } from "react-icons/go";
import "./Table.css";

const Table = ({ data = [], onRowClick, user }) => {

  const sessionId = localStorage.getItem("news_session_id") || "no_session";
  // Helper function to format date
  const formatDate = (dateString) => {
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

  // Improved source detection
  const getSource = (article) => {
    if (typeof article.source === "string") return article.source;
    if (article.source?.name) return article.source.name;
    if (article.og_publication) return article.og_publication;
    return "Unknown Source";
  };

  // Improved author detection
  const getAuthor = (article) => {
    if (Array.isArray(article.authors)) return article.authors.join(", ");
    if (article.author) return article.author;
    if (article.og_author) return article.og_author;
    return "N/A";
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text) return "N/A";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const handleViewDetails = async (item) => {
    onRowClick(item); // Originalna funkcija

    // Tracking za otvaranje članka
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/analytics/track`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "article_open",
          article_id: item.url || item._id || item.id,
          article_title: item.title,
          category: item.category || "unknown",
          subcategory: item.subcategory || "none",
          session_id: sessionId || "no_session",
          flow_type: "table",
          user_id: user?.id || user?.sub || "anonymous",
          device: "desktop",
          timestamp: new Date().toISOString(),
        }),
      });
      console.log(`[Analytics] Tracked article: ${item.title}`);
    } catch (err) {
      console.error("Error tracking article:", err);
    }
  };

  return (
    <div className="table-scroll-wrapper">
      <table>
        <thead>
          <tr>
            <th style={{ width: "5%" }}>No.</th>
            <th style={{ width: "30%" }}>Article Title</th>
            <th style={{ width: "20%" }}>Source</th>
            <th style={{ width: "15%" }}>Author</th>
            <th style={{ width: "15%" }}>Date</th>
            <th className="actions-header" style={{ width: "15%" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item._id || item.id || index}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <td>{index + 1}</td>
              <td title={item.title}>{truncateText(item.title, 80)}</td>
              <td>{getSource(item)}</td>
              <td>{getAuthor(item)}</td>
              <td>{formatDate(item.publishedAt || item.date)}</td>
              <td className="actions-cell">
                <span className="actions-btns">
                  <button
                    className="icon-btn"
                    onClick={() => handleViewDetails(item)}
                    title="View Details"
                  >
                    <GoEye size={20} />
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
