import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./Analytics.css";

const formatPageName = (name) => {
  if (!name || name === "home" || name === "/") return "Home";
  return (
    name.replace("/", "").charAt(0).toUpperCase() +
    name.replace("/", "").slice(1)
  );
};

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("7");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [gaData, setGaData] = useState([]);
  const [funnelData, setFunnelData] = useState([]);
  const [retention, setRetention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#FF6666",
    "#00ACC1",
    "#4DB6AC",
    "#9575CD",
    "#F06292",
    "#AED581",
    "#FFD54F",
    "#4FC3F7",
    "#A1887F",
  ];

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };
  // Definiramo fetchData izvan useEffect-a kako bi bila dostupna gumbu
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Dohvat dashboard podataka (Pie i Tablica)
      const resFull = await fetch(
        `${API_BASE_URL}/analytics/combined-dashboard?days=${timeRange}`,
        {
          credentials: "include",
        }
      );
      const dataFull = await resFull.json();
      setGaData(Array.isArray(dataFull) ? dataFull : []);

      // 2. Dohvat funnel podataka
      const resFunnel = await fetch(
        `${API_BASE_URL}/analytics/funnel?days=${timeRange}`
      );
      const dataFunnel = await resFunnel.json();
      const mappedFunnel = Array.isArray(dataFunnel)
        ? dataFunnel
            .map((item) => ({ step: item.step, users: item.value }))
            .sort((a, b) => b.users - a.users)
        : [];
      setFunnelData(mappedFunnel);

      // 3. Dohvat retentiona
      const resRet = await fetch(`${API_BASE_URL}/analytics/retention`);
      const dataRet = await resRet.json();
      setRetention(dataRet);
    } catch (err) {
      console.error("Greška pri dohvatu analitike:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, timeRange]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    fetchData();

    return () => window.removeEventListener("resize", handleResize);
  }, [fetchData]);

  // Logika za filtriranje i agregaciju podataka za prikaz
  const processedData = gaData
    .reduce((acc, item) => {
      // Ako je odabran filter, preskoči podatke koji ne odgovaraju uređaju
      if (
        deviceFilter !== "all" &&
        item.device?.toLowerCase() !== deviceFilter.toLowerCase()
      ) {
        return acc;
      }

      const displayName = formatPageName(item.page);
      const existing = acc.find((i) => i.displayName === displayName);

      if (existing) {
        existing.users += parseInt(item.users) || 0;
        // Prosjek trajanja sesije
        existing.avg_duration =
          (existing.avg_duration + (parseFloat(item.avg_duration) || 0)) / 2;
      } else {
        acc.push({
          ...item,
          displayName: displayName,
          users: parseInt(item.users) || 0,
          avg_duration: parseFloat(item.avg_duration) || 0,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.users - a.users);

  if (loading) {
    return (
      <div
        className="analytics-container"
        style={{ textAlign: "center", paddingTop: "100px" }}
      >
        <p className="loading">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="filter-bar">
        <div className="filter-group">
          <label>Time period:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Device:</label>
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
          >
            <option value="all">All devices</option>
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
        </div>
      </div>

      {/* SEKCIJA 1: RETENTION I UDIO */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Retention Analysis</h3>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              margin: "20px 0",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h2
                className="retention-value"
                style={{ fontSize: "2rem", marginBottom: "5px" }}
              >
                {retention?.day_1_retention || "0%"}
              </h2>
              <p style={{ color: "#10b981", fontSize: "0.8rem" }}>
                Day 1 (Actual)
              </p>
            </div>
            <div
              style={{ width: "1px", height: "40px", background: "#e2e8f0" }}
            ></div>
            <div style={{ textAlign: "center" }}>
              <h2
                className="retention-value"
                style={{
                  fontSize: "2rem",
                  color: "#FF8042",
                  marginBottom: "5px",
                }}
              >
                {retention?.day_7_retention || "0%"}
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.8rem" }}>
                Day 7 (Retention)
              </p>
            </div>
          </div>
          <p className="interpretation-text">
            <strong>Interpretation:</strong> {retention?.interpretation}
            <br />
            <strong>UX Implication:</strong>{" "}
            {parseFloat(retention?.day_7_retention) < 15
              ? "Low Day 7 retention suggests a need for introducing personalized 'breaking news' notifications."
              : "Good user return rate indicates high relevance of recommended content."}
          </p>
        </div>

        <div className="metric-card">
          <h3>User Distribution by Interests</h3>
          <div
            className="chart-container-centered"
            style={{ width: "100%", height: isMobile ? 180 : 220 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  dataKey="users"
                  nameKey="displayName"
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? "85%" : "85%"}
                  stroke="none"
                  paddingAngle={1}
                  // ANIMACIJA:
                  isAnimationActive={true}
                  animationBegin={200}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  startAngle={0}
                  endAngle={360}
                  activeIndex={activeIndex}
                  activeShape={{ outerRadius: 80 }}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  {processedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: "#f8fafc", opacity: 0.5 }} // Suptilniji kursor
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #eef2f6",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    padding: "10px 14px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                  itemStyle={{
                    color: "#1e293b",
                    padding: "2px 0",
                  }}
                  labelStyle={{
                    display: "none", // Sakriva labelu ako ti ne treba (kod PieCharta je višak)
                  }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SEKCIJA 2: FUNNEL ANALIZA */}
      <div className="analytics-section">
        <h3>1. Funnel Analysis: Conversion from Homepage to Categories</h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={funnelData}
              layout="vertical"
              margin={{ left: 0, right: 30, top: 10, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#f1f5f9"
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="step"
                type="category"
                width={isMobile ? 90 : 150}
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                  cursor={{ fill: "#f8fafc", opacity: 0.5 }} // Suptilniji kursor
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #eef2f6",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    padding: "10px 14px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                  itemStyle={{
                    color: "#1e293b",
                    padding: "2px 0",
                  }}
                  labelStyle={{
                    display: "none", // Sakriva labelu ako ti ne treba (kod PieCharta je višak)
                  }}
                />
              <Bar
                dataKey="users"
                fill="#8884d8"
                radius={[0, 4, 4, 0]}
                barSize={isMobile ? 18 : 25}
                isAnimationActive={true}
                animationBegin={200}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="interpretation-text">
          <strong>Interpretation:</strong> The chart shows a drop from{" "}
          {funnelData[0]?.users || 0} users on Home to{" "}
          {funnelData[1]?.users || 0} in the first category.
          <br />
          <strong>UX Implication:</strong> A significant "drop-off" suggests
          navigation needs to be more prominent.
        </p>
      </div>

      {/* SEKCIJA 3: PATH ANALIZA */}
      <div className="analytics-section">
        <h3>2. Path Analysis: Most Common Entry Points and Engagement</h3>
        <div className="path-table-container">
          <table className="path-table">
            <thead>
              <tr>
                <th>Path (Page)</th>
                <th>{isMobile ? "Users" : "Active Users"}</th>
                <th>{isMobile ? "Avg. Time" : "Avg. Duration"}</th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((row, i) => (
                <tr key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                  <td style={{ fontWeight: "600", color: "#1e293b" }}>
                    {row.page === "home" || row.page === "/"
                      ? "/ (Home)"
                      : `/${row.page.replace("/", "")}`}
                  </td>
                  <td>{row.users}</td>
                  <td>
                    {row.avg_duration ? Math.round(row.avg_duration) : 0}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="interpretation-text">
          <strong>Interpretation:</strong> Users spend the longest time on the
          page {processedData[0]?.displayName || "Home"}.
          <br />
          <strong>UX Implication:</strong> High duration pages are perfect for
          placing "Recommended" modules.
        </p>
      </div>
    </div>
  );
};

export default Analytics;
