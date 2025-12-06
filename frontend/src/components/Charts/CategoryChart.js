import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as d3 from "d3";
import Table from "../Table/Table";
import Cards from "../Cards/Cards";
import "./CategoryChart.css";

const BASE_URL = process.env.REACT_APP_API_URL;

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
  const svgRef = useRef(null);

  const [data, setData] = useState([]);
  const [articles, setArticles] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeColor, setActiveColor] = useState(null);
  const [error, setError] = useState(null);

  // lokalni info block
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
        const arts = await fetchArticles();
        setArticles(arts);
        setActiveFilter(null);
        setActiveColor(null);
      } catch (err) {
        console.error("Error fetching all articles:", err);
      }
    };

    fetchCategoryStats();
    fetchAllArticles();
  }, []);

  // D3 horizontal bar chart
  useEffect(() => {
    if (!data || data.length === 0) return;

    const svgEl = svgRef.current;
    const container = svgEl.parentElement;
    const width = container.clientWidth || 800;
    const height = isMobile ? 260 : 320;
    const margin = { top: 20, right: 20, bottom: 40, left: 100 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgEl).attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) || 0])
      .nice()
      .range([0, innerWidth]);

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.category))
      .range([0, innerHeight])
      .padding(0.3);

    // grid linije
    g.append("g")
      .attr("class", "d3-grid")
      .call(d3.axisBottom(x).tickSize(innerHeight).tickFormat(""))
      .selectAll("line")
      .attr("stroke", "#e0e6eb");

    // X osa
    g.append("g")
      .attr("class", "d3-x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text")
      .attr("fill", "#333446")
      .style("font-size", "11px");

    // Y osa (nazivi kategorija)
    g.append("g")
      .attr("class", "d3-y-axis")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .attr("fill", "#333446")
      .style("font-size", isMobile ? "11px" : "12px");

    // stupci – horizontalni
    const bars = g
      .selectAll(".d3-bar")
      .data(data, (d) => d.category)
      .join("rect")
      .attr("class", "d3-bar")
      .attr("y", (d) => y(d.category))
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", 0)
      .attr("rx", 4)
      .attr("ry", 4)
      .style("cursor", "pointer")
      .attr("fill", (d, i) => {
        const base = COLORS[i % COLORS.length];
        if (activeFilter && d.category === activeFilter) {
          return darkenColor(base);
        }
        return base;
      });

    // animacija širine
    bars
      .transition()
      .duration(600)
      .attr("width", (d) => x(d.count));

    // click filtriranje – dohvaća članke za kategoriju
    bars.on("click", (event, d) => {
      const index = data.findIndex((item) => item.category === d.category);
      handleBarClick({ payload: d }, index);
    });
  }, [data, activeFilter, isMobile]);

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

      setShowInfoBlock(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error("Error fetching articles for category:", error);
    }
  };

  const resetFilter = async () => {
    try {
      const arts = await fetchArticles();
      setArticles(arts);
      setActiveFilter(null);
      setActiveColor(null);
      setShowInfoBlock(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error("Error resetting filter:", error);
    }
  };

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
      <div className="category-chart-header">
        <h2>Statistics by category</h2>
      </div>

      <div className="category-chart-body">
        <svg ref={svgRef} />
      </div>

      {/* FILTER BADGE ispod grafa – identičan SubcategoryChartu */}
      {activeFilter && (
        <div className="category-chart__filter-container">
          <div
            className="category-chart__filter-badge"
            style={{ backgroundColor: activeColor || "#82ca9d" }}
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

      {/* tablica / kartice + lokalni info block (kao i prije) */}
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
