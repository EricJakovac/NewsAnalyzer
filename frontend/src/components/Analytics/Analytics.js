import React, { useEffect, useState, useCallback } from "react";
import {
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
  const [segmentedData, setSegmentedData] = useState(null);
  const [flowFunnels, setFlowFunnels] = useState({});
  const [retention, setRetention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeFunnel, setActiveFunnel] = useState("comprehensive");

  const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", 
    "#FF6666", "#00ACC1", "#4DB6AC", "#9575CD", "#F06292",
  ];

  const FUNNEL_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef"];

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Dohvat dashboard podataka
      const resFull = await fetch(
        `${API_BASE_URL}/analytics/combined-dashboard?days=${timeRange}`,
        { credentials: "include" }
      );
      const dataFull = await resFull.json();
      setGaData(Array.isArray(dataFull) ? dataFull : []);

      // 2. Dohvat comprehensive funnela (koristi flow-funnel/all)
      const resFunnel = await fetch(
        `${API_BASE_URL}/analytics/flow-funnel/all?days=${timeRange}`
      );
      const dataFunnel = await resFunnel.json();
      // flow-funnel vraća { data: [...] }, extract array
      const funnelArray = dataFunnel.data || dataFunnel;
      setFunnelData(Array.isArray(funnelArray) ? funnelArray : []);

      // 3. Dohvat segmented funnela (mobile vs desktop)
      const resSegmented = await fetch(
        `${API_BASE_URL}/analytics/segmented-funnel?days=${timeRange}&segment=device`
      );
      const segmentedResult = await resSegmented.json();
      setSegmentedData(segmentedResult);

      // 4. Dohvat različitih flow funnela
      const flowTypes = ["direct", "chart", "search", "recommendation"];
      const flowResults = {};
      
      for (const flow of flowTypes) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/analytics/flow-funnel/${flow}?days=${timeRange}`
          );
          const data = await res.json();
          flowResults[flow] = data;
        } catch (err) {
          console.error(`Error fetching ${flow} funnel:`, err);
        }
      }
      setFlowFunnels(flowResults);

      // 5. Dohvat retentiona
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

  // Logika za filtriranje i agregaciju podataka
  const processedData = gaData
    .reduce((acc, item) => {
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

  // Priprema podataka za segmented funnel prikaz
  const renderSegmentedFunnel = () => {
    if (!segmentedData || !segmentedData.segments) return null;
    
    return (
      <div className="segmented-funnel-container">
        <h4>Funnel Comparison: Mobile vs Desktop</h4>
        <div className="segmented-funnels">
          {Object.entries(segmentedData.segments).map(([segment, data], idx) => (
            <div key={segment} className="segment-funnel">
              <h5>{segment.toUpperCase()}</h5>
              <div className="segment-steps">
                {Array.isArray(data) && data.map((step, i) => (
                  <div key={i} className="segment-step">
                    <div className="segment-step-name">{step.step}</div>
                    <div className="segment-step-metrics">
                      <span className="segment-users">{step.users} users</span>
                      <span className="segment-conversion">{step.conversion_rate}</span>
                    </div>
                    <div 
                      className="segment-step-bar"
                      style={{
                        width: `${step.conversion_rate?.replace('%', '') || 0}%`,
                        backgroundColor: FUNNEL_COLORS[idx % FUNNEL_COLORS.length]
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Prikaz različitih flow funnela
  const renderFlowFunnels = () => {
    if (Object.keys(flowFunnels).length === 0) return null;
    
    const flowDisplayNames = {
      "direct": "Direct Navigation",
      "chart": "Chart Interaction", 
      "search": "Search Flow",
      "recommendation": "Recommendation"
    };

    return (
      <div className="flow-funnels-container">
        <h4>Different User Flow Types</h4>
        <div className="flow-funnels-grid">
          {Object.entries(flowFunnels).map(([flow, data], idx) => (
            <div key={flow} className="flow-funnel-card">
              <div className="flow-funnel-header">
                <h5>{flowDisplayNames[flow] || flow}</h5>
                {data.is_simulated && (
                  <span className="simulated-badge">Simulated</span>
                )}
              </div>
              {Array.isArray(data.data) && data.data.length > 0 && (
                <div className="flow-funnel-steps">
                  {data.data.map((step, i) => (
                    <div key={i} className="flow-step">
                      <div className="flow-step-info">
                        <span className="flow-step-name">{step.step}</span>
                        <span className="flow-step-users">{step.users}</span>
                      </div>
                      <div className="flow-step-bar-container">
                        <div 
                          className="flow-step-bar"
                          style={{
                            width: `${step.conversion_rate?.replace('%', '') || 0}%`,
                            backgroundColor: FUNNEL_COLORS[idx % FUNNEL_COLORS.length]
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flow-funnel-footer">
                <span className="total-conversion">
                  Total: {data.data && data.data.length > 0 
                    ? data.data[data.data.length - 1].conversion_rate 
                    : "0%"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Prikaz comprehensive funnela (svi korisnici)
  const renderComprehensiveFunnel = () => {
    return (
      <>
        <div className="funnel-visualization">
          {funnelData.map((step, index) => (
            <div key={index} className="funnel-step">
              <div className="step-header">
                <span className="step-number">{step.step_number || index + 1}</span>
                <span className="step-name">{step.step}</span>
              </div>
              <div className="step-metrics">
                <div className="metric">
                  <span className="value">{step.users}</span>
                  <span className="label">Users</span>
                </div>
                <div className="metric">
                  <span className="value" style={{ color: parseFloat(step.drop_rate) > 40 ? '#ef4444' : '#10b981' }}>
                    {step.drop_rate}
                  </span>
                  <span className="label">Drop</span>
                </div>
                <div className="metric">
                  <span className="value">{step.conversion_rate}</span>
                  <span className="label">Conversion</span>
                </div>
              </div>
              <div 
                className="step-bar" 
                style={{
                  width: `${step.conversion_rate?.replace('%', '') || 0}%`,
                  opacity: 1 - (index * 0.2),
                  backgroundColor: COLORS[index % COLORS.length]
                }}
              ></div>
            </div>
          ))}
        </div>
        
        <p className="interpretation-text">
          <strong>Interpretation:</strong> {funnelData[2]?.conversion_rate || "42%"} of users who visit 
          the app end up reading articles.
          <br />
          <strong>UX Implication:</strong> Focus on reducing drop-off at "{funnelData[1]?.step || "Interact"}" step.
        </p>
      </>
    );
  };

  if (loading) {
    return (
      <div className="analytics-container" style={{ textAlign: "center", paddingTop: "100px" }}>
        <p className="loading">Loading analytics data...</p>
        {retention?.cohorts_analyzed && (
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "10px" }}>
            Analyzing {retention.cohorts_analyzed} user cohorts...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="filter-bar">
        <div className="filter-group">
          <label>Time period:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Device:</label>
          <select value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)}>
            <option value="all">All devices</option>
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Funnel View:</label>
          <select value={activeFunnel} onChange={(e) => setActiveFunnel(e.target.value)}>
            <option value="comprehensive">All Users Flow</option>
            <option value="segmented">Segmented (Mobile/Desktop)</option>
            <option value="flows">Flow Types Comparison</option>
          </select>
        </div>
      </div>

      {/* SEKCIJA 1: RETENTION I UDIO */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Retention & Cohort Analysis</h3>
          
          {/* RETENTION STATS */}
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", margin: "20px 0" }}>
            <div style={{ textAlign: "center" }}>
              <h2 className="retention-value" style={{ fontSize: "2rem", marginBottom: "5px" }}>
                {retention?.day_1_retention || "0%"}
              </h2>
              <p style={{ color: "#10b981", fontSize: "0.8rem" }}>Day 1 (Actual)</p>
            </div>
            <div style={{ width: "1px", height: "40px", background: "#e2e8f0" }}></div>
            <div style={{ textAlign: "center" }}>
              <h2 className="retention-value" style={{ fontSize: "2rem", color: "#FF8042", marginBottom: "5px" }}>
                {retention?.day_7_retention || "0%"}
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.8rem" }}>Day 7 (Retention)</p>
            </div>
          </div>
          
          {/* COHORT ANALYSIS - NOVO */}
          {retention?.cohorts_analyzed && (
            <div className="cohort-analysis-container">
              <div className="cohort-stats">
                <span><strong>Cohorts:</strong> {retention.cohorts_analyzed}</span>
                <span><strong>Users:</strong> {retention.total_users_tracked}</span>
                {retention?.is_simulated && <span className="simulated-badge">Simulated</span>}
              </div>
              
              {retention?.cohort_example && (
                <div className="cohort-example">
                  <strong>Sample Cohort Analysis</strong>
                  <div>Cohort from {retention.cohort_example.date}</div>
                  <div>{retention.cohort_example.size} users • {retention.cohort_example.device_breakdown}</div>
                  {retention.cohort_example.primary_device && (
                    <div>Primary device: {retention.cohort_example.primary_device}</div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* INTERPRETATION */}
          <p className="interpretation-text">
            <strong>Analysis:</strong> {retention?.interpretation || "Collecting user data..."}
          </p>
        </div>

        <div className="metric-card">
          <h3>User Distribution by Interests</h3>
          <div className="chart-container-centered" style={{ width: "100%", height: isMobile ? 180 : 220 }}>
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: "#f8fafc", opacity: 0.5 }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #eef2f6",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    padding: "10px 14px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                  itemStyle={{ color: "#1e293b", padding: "2px 0" }}
                  labelStyle={{ display: "none" }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SEKCIJA 2: FUNNEL ANALIZA (ovisno o odabiru) */}
      <div className="analytics-section">
        <h3>1. User Engagement Funnel Analysis</h3>
        
        {activeFunnel === "comprehensive" && renderComprehensiveFunnel()}
        {activeFunnel === "segmented" && renderSegmentedFunnel()}
        {activeFunnel === "flows" && renderFlowFunnels()}
      </div>

      {/* SEKCIJA 3: PATH ANALIZA */}
      <div className="analytics-section">
        <h3>2. Page Engagement Analysis (Path Analysis Coming Soon)</h3>
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
                    {row.page === "home" || row.page === "/" ? "/ (Home)" : `/${row.page.replace("/", "")}`}
                  </td>
                  <td>{row.users}</td>
                  <td>{row.avg_duration ? Math.round(row.avg_duration) : 0}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="interpretation-text">
          <strong>Interpretation:</strong> Users spend the longest time on {processedData[0]?.displayName || "Home"} ({processedData[0]?.avg_duration || 0}s).
          <br />
          <strong>UX Implication:</strong> High engagement pages like {processedData[0]?.displayName || "Home"} are ideal for featured content.
        </p>
      </div>
    </div>
  );
};

export default Analytics;