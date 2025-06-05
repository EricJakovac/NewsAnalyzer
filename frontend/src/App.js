import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Menu from "./components/Menu/Menu";
import Table from "./components/Table/Table";
import {
  fetchArticles,
  fetchTopHeadlines,
  fetchArticlesByTopic,
  searchArticles,
} from "./api/NewsAPI";
import { FiRefreshCcw } from "react-icons/fi";
import Toast from "./components/Toast/Toast";

function App() {
  const [selectedMenu, setSelectedMenu] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoBlock, setShowInfoBlock] = useState(false);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [refreshing, setRefreshing] = useState(false); // NEW: for refresh loading state

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
      technology: "Technology",
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
      technology: "Innovation and tech breakthroughs that matter",
    };
    return subtitleMap[menu] || "Stay informed, stay ahead";
  }, []);

  // Map menu selections to API categories
  const getCategoryFromMenu = useCallback((menu) => {
    const categoryMap = {
      home: "general", // home uses top headlines, but maps to general for DB
      general: "general",
      business: "business",
      entertainment: "entertainment",
      health: "health",
      science: "science",
      sports: "sports",
      technology: "technology",
    };
    return categoryMap[menu] || "general";
  }, []);

  // Load articles based on selected menu
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data;

      // For other categories, get from respective collections
      const category = getCategoryFromMenu(selectedMenu);
      console.log(`Loading articles for category: ${category}`);
      data = await fetchArticles(category);

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

  // Handle refresh - fetch fresh data from external API
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);

    try {
      let result;

      if (selectedMenu === "home") {
        result = await fetchTopHeadlines();
      } else {
        const category = getCategoryFromMenu(selectedMenu);
        result = await fetchArticlesByTopic(category);
      }

      // Try to load articles from DB after fetching new ones
      try {
        await loadArticles();

        // Only show toast if both refresh and loadArticles succeed
        const articleCount = extractArticleCount(result.message);

        if (typeof articleCount === "number" && articleCount > 0) {
          showSuccessToast(
            `Successfully fetched ${articleCount} new articles!`
          );
        } else {
          showInfoToast("You're up to date! No new articles found.");
        }
      } catch (err) {
        showErrorToast(`Failed to load articles: ${err.message}`);
      }
    } catch (err) {
      showErrorToast(`Failed to refresh: ${err.message}`);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [selectedMenu, getCategoryFromMenu, loadArticles]);

  // Helper function to extract article count from API response message
  const extractArticleCount = (message) => {
    if (!message) return 0;
    // Extract number from messages like "Fetched and stored 33 top-headline articles"
    const match = message.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Different toast types with custom styling
  const showSuccessToast = (msg) => {
    setToast({ show: true, message: msg, type: "success" });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const showErrorToast = (msg) => {
    setToast({ show: true, message: msg, type: "error" });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000); // Longer for errors
  };

  const showInfoToast = (msg) => {
    setToast({ show: true, message: msg, type: "info" });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Handle search functionality using elastic search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      loadArticles();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const index = getCategoryFromMenu(selectedMenu);  // Dohvati indeks iz selektiranog taba
      const results = await searchArticles(searchQuery, index);

      setArticles(results);
      console.log(`Found ${results.length} articles matching "${searchQuery}" in index "${index}"`);
    } catch (err) {
      setError(err.message);
      console.error("Error searching articles:", err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedMenu, loadArticles, getCategoryFromMenu]);


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
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [handleSearch]);


  const handleRowClick = (article) => {
    console.log("Selected article:", article);
  };

  const handleMenuSelect = (menu) => {
    console.log("Menu selected:", menu);
    setSelectedMenu(menu);
    setSearchQuery("");
  };

  // Show toast for 3 seconds
  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  // Debounce timeout ID
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  // Funkcija koja se poziva na promjenu inputa
  const onInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear prethodni debounce timeout
    if (debounceTimeout) clearTimeout(debounceTimeout);

    // Postavi novi debounce timeout (npr. 500ms)
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500);

    setDebounceTimeout(timeoutId);
  };

  // Očisti timeout kad se komponenta unmounta ili prije novog timeouta
  useEffect(() => {
    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [debounceTimeout]);

  return (
    <div className="App">
      <Menu onSelectMenu={handleMenuSelect} selectedMenu={selectedMenu} />

      <div className="main-content">
        <div className="category-header">
          <h1 className="category-title">
            {getCategoryDisplayName(selectedMenu)}
          </h1>
          <p className="category-subtitle">
            {getCategorySubtitle(selectedMenu)}
          </p>
        </div>

        <div className="search-container" style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder={`Search ${getCategoryDisplayName(selectedMenu).toLowerCase()} articles...`}
            value={searchQuery}
            onChange={onInputChange}
            style={{ flex: 1, padding: "8px", fontSize: "16px" }}
          />
          <button
            className="refresh-btn"
            title="Refresh"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            type="button"
            style={{ padding: "8px 12px", cursor: refreshing || loading ? "not-allowed" : "pointer" }}
          >
            <FiRefreshCcw
              size={20}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        </div>

        <div
          className={`content-wrapper${showInfoBlock ? " gap-visible" : ""}`}
        >
          <div
            className={`table-container${showInfoBlock ? " table-shrink" : ""}`}
          >
            {loading ? (
              <div className="loading">
                <p>
                  Loading {getCategoryDisplayName(selectedMenu).toLowerCase()}{" "}
                  articles...
                </p>
              </div>
            ) : error ? (
              <div className="error">
                <p>Can't load data. Please refresh again.</p>
              </div>
            ) : articles.length === 0 ? (
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
            ) : (
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

          <div
            className={`right-blocks info-block-animated${showInfoBlock ? " visible" : ""
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
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "" })}
        />
      )}
    </div>
  );
}

export default App;
