import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Menu from "./components/Menu/Menu";
import Table from "./components/Table/Table";
import { fetchArticles, searchArticles } from "./api/NewsAPI";

function App() {
  const [selectedMenu, setSelectedMenu] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
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
      "sport": "sports" // Note: API uses "sports" not "sport"
    };
    return categoryMap[menu] || "general";
  }, []);

  // Memoize loadArticles function to prevent infinite re-renders
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
      setArticles([]); // Clear articles on error
    } finally {
      setLoading(false);
    }
  }, [selectedMenu, getCategoryFromMenu]);

  // Memoize search function
  const handleSearch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const category = getCategoryFromMenu(selectedMenu);
      console.log(`Searching for: "${searchQuery}" in category: ${category}`);
      const data = await searchArticles(searchQuery, category);
      setArticles(data);
      console.log(`Found ${data.length} articles`);
    } catch (err) {
      setError(err.message);
      console.error('Error searching articles:', err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedMenu, getCategoryFromMenu]);

  // Combined effect for loading articles and search
  useEffect(() => {
    // If no search query, load articles normally
    if (!searchQuery.trim()) {
      loadArticles();
      return;
    }

    // If there's a search query, debounce the search
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500); // 500ms debounce for search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, loadArticles, handleSearch]); // Include all dependencies

  // Handle article row click
  const handleRowClick = (article) => {
    console.log('Selected article:', article);
    // You can implement article detail view here later
  };

  // Handle menu selection
  const handleMenuSelect = (menu) => {
    console.log('Menu selected:', menu);
    setSelectedMenu(menu);
    setSearchQuery(""); // Clear search when changing categories
  };

  return (
    <div className="App">
      <Menu onSelectMenu={handleMenuSelect} />

      <div className="main-content">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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

          {/* Info block is always rendered for smooth animation */}
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
