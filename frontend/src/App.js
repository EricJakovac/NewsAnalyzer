import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Menu from "./components/Menu/Menu";
import Table from "./components/Table/Table";
import { fetchArticles } from "./api/NewsAPI";

function App() {
  const [selectedMenu, setSelectedMenu] = useState("general");
  const [showInfoBlock, setShowInfoBlock] = useState(false);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map menu selections to API categories
  const getCategoryFromMenu = useCallback((menu) => {
    const categoryMap = {
      "home": "general",
      "business": "business",
      "entertainment": "entertainment", 
      "health": "health",
      "science": "science",
      "sports": "sports" 
    };
    return categoryMap[menu] || "general";
  }, []);

  // Load articles based on selected menu
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const category = getCategoryFromMenu(selectedMenu);
      console.log(`Loading articles for category: ${category}`);
      const data = await fetchArticles(category, 50);
      setArticles(data);
      console.log(`Loaded ${data.length} articles`);
    } catch (err) {
      setError(err.message);
      console.error('Error loading articles:', err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMenu, getCategoryFromMenu]);

  // Load articles when selectedMenu changes
  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleRowClick = (article) => {
    console.log('Selected article:', article);
  };

  const handleMenuSelect = (menu) => {
    console.log('Menu selected:', menu);
    setSelectedMenu(menu);
  };

  return (
    <div className="App">
      <Menu onSelectMenu={handleMenuSelect} />

      <div className="main-content">
        <div className={`content-wrapper${showInfoBlock ? " gap-visible" : ""}`}>
          <div className={`table-container${showInfoBlock ? " table-shrink" : ""}`}>
            {loading && (
              <div className="loading">
                <p>Loading articles...</p>
              </div>
            )}

            {error && (
              <div className="error">
                <p>Error: {error}</p>
                <button onClick={loadArticles} className="retry-btn">
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && articles.length === 0 && (
              <div className="no-results">
                <p>No articles found.</p>
              </div>
            )}

            {!loading && !error && articles.length > 0 && (
              <Table
                data={articles}
                onRowClick={handleRowClick}
                onShowInfoBlock={() => setShowInfoBlock(true)}
              />
            )}
          </div>

          <div className={`right-blocks info-block-animated${showInfoBlock ? " visible" : ""}`}>
            <div className="info-block placeholder">
              <h3>Article Details</h3>
              <p>Select an article to view details here.</p>
              <button
                className="close-info-btn"
                onClick={() => setShowInfoBlock(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
