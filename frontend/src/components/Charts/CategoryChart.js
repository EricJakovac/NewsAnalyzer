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
import Table from "../Table/Table"; // prilagodi putanju ako treba

const BASE_URL = "http://localhost:5000";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#00c49f", "#ff69b4", "#a28cfe"];

// Pomoćna funkcija za zatamnjivanje boje (hover efekt)
const darkenColor = (color) => {
  let c = color.substring(1); // ukloni #
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

// Funkcija za dohvat top-headlines (bez topic)
export const fetchArticles = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/top-headlines`);
    // Osiguraj da vraća niz
    return Array.isArray(response.data.articles) ? response.data.articles : [];
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
};

const CategoryChart = () => {
  const [data, setData] = useState([]);
  const [articles, setArticles] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeColor, setActiveColor] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryStats = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/category-stats`);
        console.log("Dohvaćeni category stats:", response.data);
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || "Error loading category statistics.");
        setData([]);
      }
    };

    const fetchAllArticles = async () => {
      try {
        const articles = await fetchArticles();
        console.log("Dohvaćeni svi članci:", articles);
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
      console.log(`Dohvaćeni članci za kategoriju ${clickedCategory}:`, response.data);
      setArticles(response.data);
      setActiveFilter(clickedCategory);
      setActiveColor(COLORS[index % COLORS.length]);
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
    } catch (error) {
      console.error("Error resetting filter:", error);
    }
  };

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (data.length === 0) {
    return <p>No category data available.</p>;
  }

  return (
    <div>
      <h2 style={{ textAlign: "center" }}>Statistika po kategorijama</h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {activeFilter && (
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <button
            onClick={resetFilter}
            style={{
              backgroundColor: activeColor || "#82ca9d",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = darkenColor(activeColor || "#82ca9d"))}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = activeColor || "#82ca9d")}
          >
            Poništi filter ({activeFilter})
          </button>
        </div>
      )}

      <div style={{
        display: "flex",
        flexDirection: "column",
        height: "54vh" // možeš prilagoditi visinu po potrebi
      }}>
        <h3 style={{ textAlign: "center", flexShrink: 0 }}>
          {activeFilter ? `Članci za kategoriju: ${activeFilter}` : "Svi članci"}
        </h3>

        <div style={{
          flexGrow: 1,
          overflowY: "auto",
          minHeight: 0 // važno za flexbox scroll na nekim preglednicima
        }}>
          <Table
            data={articles}
            onRowClick={(article) => {
              console.log("Clicked article:", article);
            }}
          />
        </div>
      </div>

    </div>
  );
};

export default CategoryChart;
