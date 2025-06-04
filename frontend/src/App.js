import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Menu from "./components/Menu/Menu";
import Table from "./components/Table/Table";
import { fetchArticles } from "./api/NewsAPI";
import { FiRefreshCcw } from "react-icons/fi";
import Toast from "./components/Toast/Toast";

function App() {
  const [selectedMenu, setSelectedMenu] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoBlock, setShowInfoBlock] = useState(false);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "" });

  // Map menu selections to display names
  const getCategoryDisplayName = useCallback((menu) => {
    const displayMap = {
      home: "Top Headlines",
      general: "General",
      business: "Business",
      entertainment: "Entertainment",
      health: "Health",
      science: "Science",
      sports: "Sports",
    };
    return displayMap[menu] || "Home";
  }, []);

  // Map menu selections to catchy subtitles
  const getCategorySubtitle = useCallback((menu) => {
    const subtitleMap = {
      home: "Breaking stories that shape your world today",
      general: "General world news and trending topics",
      business: "Latest market moves and business insights",
      entertainment: "Your daily dose of entertainment buzz",
      health: "Wellness updates and health breakthroughs",
      science: "Discoveries that change everything",
      sports: "Game-changing moments and athletic achievements",
    };
    return subtitleMap[menu] || "Stay informed, stay ahead";
  }, []);

  // Map menu selections to API categories
  const getCategoryFromMenu = useCallback((menu) => {
    const categoryMap = {
      home: "general",
      general: "general",
      business: "business",
      entertainment: "entertainment",
      health: "health",
      science: "science",
      sports: "sports",
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
      console.error("Error loading articles:", err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMenu, getCategoryFromMenu]);

  // Handle search functionality
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      loadArticles();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const category = getCategoryFromMenu(selectedMenu);
      console.log(`Searching for: "${searchQuery}" in category: ${category}`);

      // For now, get all articles and filter on frontend
      // Later you can implement backend search endpoint
      const data = await fetchArticles(category, 100);
      const filteredArticles = data.filter(
        (article) =>
          article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          article.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setArticles(filteredArticles);
      console.log(
        `Found ${filteredArticles.length} articles matching "${searchQuery}"`
      );
    } catch (err) {
      setError(err.message);
      console.error("Error searching articles:", err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedMenu, getCategoryFromMenu, loadArticles]);

  // Load articles when selectedMenu changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      loadArticles();
    }
  }, [loadArticles, searchQuery]);

  // Handle search with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500); // 500ms debounce for search

    return () => clearTimeout(timeoutId);
  }, [handleSearch]);

  const handleRowClick = (article) => {
    console.log("Selected article:", article);
    // You can implement article detail view here later
  };

  const handleMenuSelect = (menu) => {
    console.log("Menu selected:", menu);
    setSelectedMenu(menu);
    setSearchQuery(""); // Clear search when changing categories
  };

  // Show toast for 3 seconds
  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  return (
    <div className="App">
      <Menu onSelectMenu={handleMenuSelect} selectedMenu={selectedMenu} />

      <div className="main-content">
        {/* Category Title */}
        <div className="category-header">
          <h1 className="category-title">
            {getCategoryDisplayName(selectedMenu)}
          </h1>
          <p className="category-subtitle">
            {getCategorySubtitle(selectedMenu)}
          </p>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder={`Search ${getCategoryDisplayName(
              selectedMenu
            ).toLowerCase()} articles...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="refresh-btn"
            title="Refresh"
            onClick={() => showToast("Articles refreshed! (placeholder)")}
            type="button"
          >
            <FiRefreshCcw size={20} />
          </button>
        </div>

        <div
          className={`content-wrapper${showInfoBlock ? " gap-visible" : ""}`}
        >
          <div
            className={`table-container${showInfoBlock ? " table-shrink" : ""}`}
          >
            {loading && (
              <div className="loading">
                <p>
                  Loading {getCategoryDisplayName(selectedMenu).toLowerCase()}{" "}
                  articles...
                </p>
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
                <p>
                  {searchQuery.trim()
                    ? `No articles found for "${searchQuery}" in ${getCategoryDisplayName(
                        selectedMenu
                      ).toLowerCase()}.`
                    : `No ${getCategoryDisplayName(
                        selectedMenu
                      ).toLowerCase()} articles found.`}
                </p>
                {searchQuery.trim() && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="clear-search-btn"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {!loading && !error && articles.length > 0 && (
              <>
                {searchQuery.trim() && (
                  <div className="search-results-info">
                    <p>
                      Found {articles.length} article
                      {articles.length !== 1 ? "s" : ""}
                      for "{searchQuery}" in{" "}
                      {getCategoryDisplayName(selectedMenu).toLowerCase()}
                    </p>
                  </div>
                )}
                <Table
                  data={articles}
                  onRowClick={handleRowClick}
                  onShowInfoBlock={() => setShowInfoBlock(true)}
                />
              </>
            )}
          </div>

          {/* Info block is always rendered for smooth animation */}
          <div
            className={`right-blocks info-block-animated${
              showInfoBlock ? " visible" : ""
            }`}
          >
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
      {toast.show && (
        <Toast
          message={toast.message}
          onClose={() => setToast({ show: false, message: "" })}
        />
      )}
    </div>
  );
}

export default App;
