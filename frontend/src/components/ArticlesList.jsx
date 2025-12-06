import React, { useEffect, useState } from "react";

const BASE_URL = process.env.REACT_APP_API_URL;

const ArticlesList = ({ topic }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!topic) return;

    setLoading(true);
    fetch(`${BASE_URL}/articles/${topic}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch articles");
        return res.json();
      })
      .then((data) => {
        setArticles(data.articles);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError("Greška pri dohvaćanju članaka.");
        setArticles([]);
      })
      .finally(() => setLoading(false));
  }, [topic]);

  if (loading) return <p>Učitavanje članaka...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Članci za temu: {topic}</h2>

      {articles.length === 0 ? (
        <p>Nema dostupnih članaka.</p>
      ) : (
        <ul>
          {articles.map((article, idx) => (
            <li key={idx} style={{ marginBottom: "1rem" }}>
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                <strong>{article.title}</strong>
              </a>
              <p>{article.description}</p>
              <small>{new Date(article.publishedAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ArticlesList;
