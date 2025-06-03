import React from "react";
import { GoEye, GoGraph } from "react-icons/go";
import "./Table.css";

const Table = ({ data, onRowClick, onShowInfoBlock }) => {
  // Helper function to format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Helper function to extract country/source
  const getSource = (article) => {
    return article.source?.name || 'Unknown Source';
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th style={{ width: '35%' }}>Article Title</th>
            <th style={{ width: '20%' }}>Source</th>
            <th style={{ width: '15%' }}>Author</th>
            <th style={{ width: '15%' }}>Date</th>
            <th className="actions-header" style={{ width: '15%' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item._id || item.id || index}>
              <td title={item.title}>{truncateText(item.title, 80)}</td>
              <td>{getSource(item)}</td>
              <td>{item.author || 'N/A'}</td>
              <td>{formatDate(item.publishedAt || item.date)}</td>
              <td className="actions-cell">
                <span className="actions-btns">
                  <button
                    className="icon-btn"
                    onClick={() => onRowClick(item)}
                    title="View Details"
                  >
                    <GoEye size={20} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={onShowInfoBlock}
                    title="Show Info Block"
                  >
                    <GoGraph size={20} />
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
