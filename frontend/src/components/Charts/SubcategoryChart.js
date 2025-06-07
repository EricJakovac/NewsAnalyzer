import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import axios from "axios";
import Table from "../Table/Table";

const BASE_URL = "http://localhost:5000";

// Boje za stupce (dodaj ili promijeni po želji)
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#00c49f", "#ff69b4", "#a28cfe"];

// Funkcija za dohvat članaka po temi
export const fetchArticles = async (topic) => {
    try {
        const response = await axios.get(`${BASE_URL}/articles/${topic}`);
        return response.data.articles;
    } catch (error) {
        console.error("Error fetching articles:", error);
        throw error;
    }
};

// Pomoćna funkcija za zatamnjivanje boje (hover efekt)
const darkenColor = (color) => {
    // Jednostavno zatamnjivanje boje za hover efekt
    let c = color.substring(1); // ukloni #
    let rgb = parseInt(c, 16);
    let r = (rgb >> 16) & 0xff;
    let g = (rgb >> 8) & 0xff;
    let b = rgb & 0xff;

    // smanji svaku komponentu za 20%
    r = Math.max(0, Math.floor(r * 0.8));
    g = Math.max(0, Math.floor(g * 0.8));
    b = Math.max(0, Math.floor(b * 0.8));

    const toHex = (x) => x.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const SubcategoryChart = ({ topic }) => {
    const [data, setData] = useState([]);
    const [articles, setArticles] = useState([]); // za prikaz filtriranih članaka
    const [activeFilter, setActiveFilter] = useState(null); // trenutno odabrani filter
    const [activeColor, setActiveColor] = useState(null); // boja stupca na koji je kliknuto

    // Dohvati osnovnu statistiku po subkategorijama i sve članke na početku
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

    // Klik na stupac → dohvati članke za tu subkategoriju i postavi boju gumba
    const handleBarClick = async (entry, index) => {
        const clickedSubcategory = entry.payload.subcategory;
        try {
            const response = await axios.get(`${BASE_URL}/articles-by-subcategory`, {
                params: { subcategory: clickedSubcategory },
            });
            setArticles(response.data);
            setActiveFilter(clickedSubcategory);
            setActiveColor(COLORS[index % COLORS.length]);
        } catch (error) {
            console.error("Greška pri dohvaćanju članaka za subkategoriju:", error);
        }
    };

    // Poništi filter i vrati boju gumba na default
    const resetFilter = async () => {
        try {
            const articles = await fetchArticles(topic);
            setArticles(articles);
            setActiveFilter(null);
            setActiveColor(null);
        } catch (error) {
            console.error("Greška pri resetiranju filtera:", error);
        }
    };

    return (
        <div>
            <h2 style={{ textAlign: "center" }}>Statistika po subkategorijama</h2>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <XAxis dataKey="subcategory" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                        dataKey="count"
                        onClick={(data, index) => handleBarClick(data, index)}
                        barSize={80}
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
                marginTop: "1px",
                display: "flex",
                flexDirection: "column",
                height: "54vh" // ili druga visina po potrebi
            }}>
                <h3 style={{ textAlign: "center", flexShrink: 0 }}>
                    {activeFilter
                        ? `Članci za subkategoriju: ${activeFilter}`
                        : "Svi članci za temu"}
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

export default SubcategoryChart;
