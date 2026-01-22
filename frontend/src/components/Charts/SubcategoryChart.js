import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import * as d3 from "d3";
import Table from "../Table/Table";
import Cards from "../Cards/Cards";
import "./SubcategoryChart.css";

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

const SubcategoryChart = ({ topic, user }) => {
  const isMobile = window.innerWidth < 768;
  const svgRef = useRef(null);
  const sessionId = localStorage.getItem("news_session_id") || "no_session";

  const [data, setData] = useState([]);
  const [articles, setArticles] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeColor, setActiveColor] = useState(null);

  // lokalni info block
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showInfoBlock, setShowInfoBlock] = useState(false);

  // Definišite handleBarClick na vrhu komponente sa useCallback
  const handleBarClick = useCallback(async (entry, index) => {
    const clickedSubcategory = entry.payload.subcategory;
    if (!clickedSubcategory) return;

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/analytics/track`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "chart_filter_click",
          chart_type: "subcategory_chart",
          filter_value: clickedSubcategory,
          session_id: sessionId || "no_session", 
          flow_type: "chart_interaction",
          page: window.location.pathname,
          user_id: user?.id || user?.sub || "anonymous",
          device: window.innerWidth < 768 ? "mobile" : "desktop",
          timestamp: new Date().toISOString(),
        }),
      });
      console.log(`[Analytics] Tracked subchart filter: ${clickedSubcategory}`);
    } catch (err) {
      console.error("Error tracking subchart click:", err);
    }

    try {
      const response = await axios.get(`${BASE_URL}/articles-by-subcategory`, {
        params: { subcategory: clickedSubcategory },
      });

      setArticles(response.data);
      setActiveFilter(clickedSubcategory);
      setActiveColor(COLORS[index % COLORS.length]);

      setShowInfoBlock(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error("Greška pri dohvaćanju članaka za subkategoriju:", error);
    }
  }, [user]);

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
        const arts = await fetchArticles(topic);
        setArticles(arts);
        setActiveFilter(null);
        setActiveColor(null);
        setShowInfoBlock(false);
        setSelectedArticle(null);
      } catch (error) {
        console.error("Greška pri dohvaćanju svih članaka:", error);
      }
    };

    fetchSubcategoryStats();
    fetchAllArticles();
  }, [topic]);

  // D3 horizontal bar chart (isti izgled kao CategoryChart)
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
      .domain(data.map((d) => d.subcategory))
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

    // Y osa (nazivi subkategorija)
    g.append("g")
      .attr("class", "d3-y-axis")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .attr("fill", "#333446")
      .style("font-size", isMobile ? "11px" : "12px");

    // Kreiramo grupe za svaki redak
    const barGroups = g
      .selectAll(".bar-group")
      .data(data, (d) => d.subcategory)
      .join("g")
      .attr("class", "bar-group")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        const index = data.findIndex(
          (item) => item.subcategory === d.subcategory,
        );
        handleBarClick({ payload: d }, index);
      });

    // 1. Dodajemo pozadinski "highlight" pravokutnik (cijela širina grafikona)
    barGroups
      .append("rect")
      .attr("class", "chart-row-hover")
      .attr("x", 0)
      .attr("y", (d) => y(d.subcategory) - (y.step() * y.paddingInner()) / 2)
      .attr("width", innerWidth)
      .attr("height", y.step())
      .attr("rx", 4);

    // 2. Dodajemo tvoj postojeći stupac (bar)
    const bars = barGroups
      .append("rect")
      .attr("class", "d3-bar")
      .attr("y", (d) => y(d.subcategory))
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", 0)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", (d, i) => {
        const base = COLORS[i % COLORS.length];
        const isFiltered = activeFilter === d.subcategory;
        return isFiltered ? darkenColor(base) : base;
      });

    // animacija širine
    bars
      .transition()
      .duration(600)
      .attr("width", (d) => x(d.count));

    // click filtriranje po subkategoriji
    bars.on("click", (event, d) => {
      const index = data.findIndex(
        (item) => item.subcategory === d.subcategory,
      );
      handleBarClick({ payload: d }, index);
    });
  }, [data, activeFilter, isMobile, handleBarClick]);

  const resetFilter = async () => {
    try {
      const arts = await fetchArticles(topic);
      setArticles(arts);
      setActiveFilter(null);
      setActiveColor(null);
      setShowInfoBlock(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error("Greška pri resetiranju filtera:", error);
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

  if (data.length === 0) {
    return <p className="loading">Loading subcategory data...</p>;
  }

  return (
    <div className="subcategory-chart">
      <div className="subcategory-chart-header">
        <h2>Statistics by subcategory</h2>
      </div>

      <div className="subcategory-chart-body">
        <svg ref={svgRef} />
      </div>

      {/* FILTER BADGE ispod grafa – isti izgled kao CategoryChart */}
      {activeFilter && (
        <div className="subcategory-chart__filter-container">
          <div
            className="subcategory-chart__filter-badge"
            style={{ backgroundColor: activeColor || "#82ca9d" }}
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
                    <strong>Subcategory:</strong>
                    <span className="subcategory-tag">
                      {selectedArticle.subcategory || "General"}
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
                        selectedArticle.publishedAt,
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