import React, { useEffect, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import './Analytics.css';

const Analytics = () => {
    const [gaData, setGaData] = useState([]);
    const [funnelData, setFunnelData] = useState([]);
    const [retention, setRetention] = useState(null);
    const [loading, setLoading] = useState(true);
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Pratimo širinu ekrana za dinamičku prilagodbu grafikona
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        const fetchData = async () => {
            setLoading(true);
            try {
                const resFull = await fetch(`${API_BASE_URL}/analytics/full-report`, { 
                    credentials: 'include' 
                });
                const dataFull = await resFull.json();
                setGaData(Array.isArray(dataFull) ? dataFull : []);

                const resFunnel = await fetch(`${API_BASE_URL}/api/analytics/funnel`);
                const dataFunnel = await resFunnel.json();
                setFunnelData(Array.isArray(dataFunnel) ? dataFunnel : []);

                const resRet = await fetch(`${API_BASE_URL}/analytics/retention`);
                const dataRet = await resRet.json();
                setRetention(dataRet);
            } catch (err) {
                console.error("Greška pri dohvatu analitike:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => window.removeEventListener('resize', handleResize);
    }, [API_BASE_URL]);

    if (loading) {
        return (
            <div className="analytics-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <h2>Učitavanje analitičkih podataka...</h2>
            </div>
        );
    }

    return (
        <div className="analytics-container">
            {/* SEKCIJA 1: OSNOVNE METRIKE (Retention i PieChart) */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <h3>Day 1 Retention</h3>
                    <h2 className="retention-value">
                        {retention?.day_1_retention || "0%"}
                    </h2>
                    <p className="interpretation-text">
                        {retention?.interpretation || "Postotak korisnika koji se vratio drugi dan."}
                    </p>
                </div>

                <div className="metric-card">
                    <h3>Udio po stranicama</h3>
                    <div className="chart-container-centered" style={{ width: '100%', height: isMobile ? 180 : 220 }}>
                        {gaData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <Pie 
                                        data={gaData} 
                                        dataKey="users" 
                                        nameKey="page" 
                                        cx="50%" 
                                        cy="50%" 
                                        outerRadius={isMobile ? "80%" : "90%"} 
                                        stroke="none"
                                    >
                                        {gaData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p>Nema dostupnih podataka</p>}
                    </div>
                </div>
            </div>

            {/* SEKCIJA 2: FUNNEL ANALIZA */}
            <div className="analytics-section">
                <h3>1. Funnel Analiza: Putanja do konverzije</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={funnelData} 
                            layout="vertical" 
                            margin={{ left: 0, right: 30, top: 10, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="step" 
                                type="category" 
                                width={isMobile ? 90 : 150} 
                                tick={{ fontSize: 11, fill: '#64748b' }} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip cursor={{ fill: '#f8fafc' }} />
                            <Bar 
                                dataKey="users" 
                                fill="#8884d8" 
                                name="Korisnici" 
                                radius={[0, 4, 4, 0]} 
                                barSize={isMobile ? 18 : 25} 
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <p className="interpretation-text">
                    Najveći pad posjetitelja obično se događa na koraku prijave.
                </p>
            </div>

            {/* SEKCIJA 3: PATH ANALIZA (TABLICA) */}
            <div className="analytics-section">
                <h3>2. Path Analiza: Najčešće putanje</h3>
                <div className="path-table-container">
                    <table className="path-table">
                        <thead>
                            <tr>
                                <th>Putanja</th>
                                <th>Posjetitelji</th>
                                <th>Trajanje (s)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gaData.length > 0 ? gaData.map((row, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: '600', color: '#1e293b' }}>{row.page}</td>
                                    <td>{row.users}</td>
                                    <td>{Math.round(row.avg_duration)}s</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                                        Nema podataka za prikaz.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Analytics;