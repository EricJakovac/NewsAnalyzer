import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import axios from "axios";
import Table from "../Table/Table";
import "./SubcategoryChart.css";
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

export const fetchArticles = async (topic) => {
  try {
    const response = await axios.get(`${BASE_URL}/articles/${topic}`);
    return response.data.articles;
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }
};

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

const SubcategoryChart = ({ topic }) => {
  const isMobile = window.innerWidth < 768;
  const [data, setData] = useState([]);
  const [articles, setArticles] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeColor, setActiveColor] = useState(null);

  // Local info block state
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showInfoBlock, setShowInfoBlock] = useState(false);

  useEffect(() => {
    const fetchSubcategoryStats = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/subcategory-stats`, {
          params: { topic },
        });
        setData(response.data);
      } catch (error) {
        console.error("Greška pri dohvaćanju statistike:", error);
      }
    };

    const fetchAllArticles = async () => {
      try {
        const articles = await fetchArticles(topic);
        setArticles(articles);
      } catch (error) {
        console.error("Greška pri dohvaćanju svih članaka:", error);
      }
    };

    fetchSubcategoryStats();
    fetchAllArticles();
  }, [topic]);

  const handleBarClick = async (entry, index) => {
    const clickedSubcategory = entry.payload.subcategory;
    try {
      const response = await axios.get(`${BASE_URL}/articles-by-subcategory`, {
        params: { subcategory: clickedSubcategory },
      });
      setArticles(response.data);
      setActiveFilter(clickedSubcategory);
      setActiveColor(COLORS[index % COLORS.length]);
      // Close info block when filter changes
      setShowInfoBlock(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error("Greška pri dohvaćanju članaka za subkategoriju:", error);
    }
  };

  const resetFilter = async () => {
    try {
      const articles = await fetchArticles(topic);
      setArticles(articles);
      setActiveFilter(null);
      setActiveColor(null);
      // Close info block when filter is reset
      setShowInfoBlock(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error("Greška pri resetiranju filtera:", error);
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

  return (
    <div className="subcategory-chart">
      <h2 className="subcategory-chart__title">Statistics by subcategory</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="subcategory" />
          <YAxis />
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
        <div className="subcategory-chart__filter-container">
          <div
            className="subcategory-chart__filter-badge"
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
            <span className="subcategory-chart__filter-text">
              {activeFilter} ({articles.length})
            </span>
            <button
              className="subcategory-chart__close-btn"
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
        className={`subcategory-chart__content-wrapper${
          showInfoBlock ? " gap-visible" : ""
        }`}
      >
        <div
          className={`subcategory-chart__table-container${
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
          className={`subcategory-chart__info-block-animated${
            showInfoBlock ? " visible" : ""
          }`}
        >
          <div className="subcategory-chart__info-block">
            {selectedArticle ? (
              <>
                <div className="subcategory-chart__article-header">
                  <h3>Article Details</h3>
                  <button
                    className="subcategory-chart__close-info-btn"
                    onClick={() => {
                      setShowInfoBlock(false);
                      setSelectedArticle(null);
                    }}
                  >
                    ×
                  </button>
                </div>

                <div className="subcategory-chart__article-content">
                  <div className="subcategory-chart__article-field">
                    <strong>Title:</strong>
                    <p>{selectedArticle.title}</p>
                  </div>

                  <div className="subcategory-chart__article-field">
                    <strong>Category:</strong>
                    <span className="category-tag">{topic}</span>
                  </div>

                  <div className="subcategory-chart__article-field">
                    <strong>Subcategory:</strong>
                    <span className="subcategory-tag">
                      {selectedArticle.subcategory || "Other"}
                    </span>
                  </div>

                  <div className="subcategory-chart__article-field">
                    <strong>Description:</strong>
                    <p>
                      {selectedArticle.description ||
                        "No description available"}
                    </p>
                  </div>

                  <div className="subcategory-chart__article-field">
                    <strong>Published:</strong>
                    <p>
                      {new Date(
                        selectedArticle.publishedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="subcategory-chart__article-field">
                    <strong>Source:</strong>
                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="subcategory-chart__source-link"
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
                  className="subcategory-chart__close-info-btn"
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

export default SubcategoryChart;
