import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import Table from "../Table/Table";
import "./CategoryChart.css";
import Cards from "../Cards/Cards";

const BASE_URL = "http://localhost:5000";
const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7f50",
  "#00c49f",
  "#ff69b4",
  "#a28cfe",
];

const darkenColor = (color) => {
  let c = color.substring(1);
  let rgb = parseInt(c, 16);
  let r = (rgb >> 16) & 0xff;
  let g = (rgb >> 8) & 0xff;
  let b = rgb & 0xff;

  r = Math.max(0, Math.floor(r * 0.8));
  g = Math.max(0, Math.floor(g * 0.8));
  b = Math.max(0, Math.floor(b * 0.8));

  const toHex = (x) => x.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const fetchArticles = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/top-headlines`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
};

const CategoryChart = () => {
  const isMobile = window.innerWidth < 768;
  const [data, setData] = useState([]);
  const [articles, setArticles] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeColor, setActiveColor] = useState(null);
  const [error, setError] = useState(null);

  // Local info block state
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showInfoBlock, setShowInfoBlock] = useState(false);

  useEffect(() => {
    const fetchCategoryStats = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/category-stats`);
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(
          err.response?.data?.error || "Error loading category statistics."
        );
        setData([]);
      }
    };

    const fetchAllArticles = async () => {
      try {
        const articles = await fetchArticles();
        setArticles(articles);
        setActiveFilter(null);
        setActiveColor(null);
      } catch (error) {
        console.error("Error fetching all articles:", error);
      }
    };

    fetchCategoryStats();
    fetchAllArticles();
  }, []);

  const handleBarClick = async (entry, index) => {
    if (!entry || !entry.payload || !entry.payload.category) return;
    const clickedCategory = entry.payload.category;
    try {
      const response = await axios.get(`${BASE_URL}/articles-by-category`, {
        params: { category: clickedCategory },
      });
      setArticles(response.data);
      setActiveFilter(clickedCategory);
      setActiveColor(COLORS[index % COLORS.length]);
      // Close info block when filter changes
      setShowInfoBlock(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error("Error fetching articles for category:", error);
    }
  };

  const resetFilter = async () => {
    try {
      const articles = await fetchArticles();
      setArticles(articles);
      setActiveFilter(null);
      setActiveColor(null);
      // Close info block when filter is reset
      setShowInfoBlock(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error("Error resetting filter:", error);
    }
  };

  // Local row click handler for the chart's table
  const handleRowClick = (article) => {
    if (
      selectedArticle &&
      selectedArticle.url === article.url &&
      showInfoBlock
    ) {
      setShowInfoBlock(false);
      setSelectedArticle(null);
    } else {
      setSelectedArticle(article);
      setShowInfoBlock(true);
    }
  };

  if (error) {
    return <p className="category-chart__error">{error}</p>;
  }

  if (data.length === 0) {
    return (
      <p className="category-chart__no-data">No category data available.</p>
    );
  }

  return (
    <div className="category-chart">
      <h2 className="category-chart__title">Statistics by category</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar
            dataKey="count"
            onClick={(data, index) => handleBarClick(data, index)}
            barSize={80}
            cursor="pointer"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {activeFilter && (
        <div className="category-chart__filter-container">
          <div
            className="category-chart__filter-badge"
            style={{ backgroundColor: activeColor || "#82ca9d" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = darkenColor(
                activeColor || "#82ca9d"
              ))
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = activeColor || "#82ca9d")
            }
          >
            <span className="category-chart__filter-text">
              {activeFilter} ({articles.length})
            </span>
            <button
              className="category-chart__close-btn"
              onClick={resetFilter}
              title="Remove filter"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Chart table with local info block */}
      <div
        className={`category-chart__content-wrapper${
          showInfoBlock ? " gap-visible" : ""
        }`}
      >
        <div
          className={`category-chart__table-container${
            showInfoBlock ? " table-shrink" : ""
          }`}
        >
          {isMobile ? (
            <Cards data={articles} onRowClick={handleRowClick} />
          ) : (
            <Table data={articles} onRowClick={handleRowClick} />
          )}
        </div>

        {/* Local info block for the chart */}
        <div
          className={`category-chart__info-block-animated${
            showInfoBlock ? " visible" : ""
          }`}
        >
          <div className="category-chart__info-block">
            {selectedArticle ? (
              <>
                <div className="category-chart__article-header">
                  <h3>Article Details</h3>
                  <button
                    className="category-chart__close-info-btn"
                    onClick={() => {
                      setShowInfoBlock(false);
                      setSelectedArticle(null);
                    }}
                  >
                    ×
                  </button>
                </div>

                <div className="category-chart__article-content">
                  <div className="category-chart__article-field">
                    <strong>Title:</strong>
                    <p>{selectedArticle.title}</p>
                  </div>

                  <div className="category-chart__article-field">
                    <strong>Category:</strong>
                    <span className="category-tag">
                      {selectedArticle.category || "General"}
                    </span>
                  </div>

                  <div className="category-chart__article-field">
                    <strong>Description:</strong>
                    <p>
                      {selectedArticle.description ||
                        "No description available"}
                    </p>
                  </div>

                  <div className="category-chart__article-field">
                    <strong>Published:</strong>
                    <p>
                      {new Date(
                        selectedArticle.publishedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="category-chart__article-field">
                    <strong>Source:</strong>
                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="category-chart__source-link"
                    >
                      Read Full Article →
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3>Article Details</h3>
                <p>Select an article to view details here.</p>
                <button
                  className="category-chart__close-info-btn"
                  onClick={() => setShowInfoBlock(false)}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryChart;
