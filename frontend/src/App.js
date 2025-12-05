import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import Menu from "./components/Menu/Menu";
import Table from "./components/Table/Table";
import Search from "./components/Search/Search";
import {
  fetchArticles,
  fetchTopHeadlines,
  fetchArticlesByTopic,
  searchArticles,
  getTopHeadlines,
} from "./api/NewsAPI";
import Toast from "./components/Toast/Toast";
import SubcategoryChart from "./components/Charts/SubcategoryChart";
import CategoryChart from "./components/Charts/CategoryChart";
import Cards from "./components/Cards/Cards";

function App() {
  const isMobile = window.innerWidth < 768;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoBlock, setShowInfoBlock] = useState(false);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Ref for scrollable content
  const mainContentRef = useRef(null);

  // List of tabs that have subcategories and should show the chart
  const tabsWithSubcategory = [
    "business",
    "entertainment",
    "health",
    "science",
    "sports",
    "technology",
    "general",
  ];

  // Display names for categories
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

  // Subtitles for categories
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

  // API categories
  const getCategoryFromMenu = useCallback((menu) => {
    const categoryMap = {
      home: "general",
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

      if (selectedMenu === "home") {
        console.log("Loading top headlines from database");
        data = await getTopHeadlines();
      } else {
        const category = getCategoryFromMenu(selectedMenu);
        console.log(`Loading articles for category: ${category}`);
        data = await fetchArticles(category);
      }

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

  // Helper: extract article count from backend response
  const extractArticleCount = (message) => {
    if (!message) return 0;
    const match = message.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Toast helpers
  const showSuccessToast = (msg) => {
    setToast({ show: true, message: msg, type: "success" });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };
  const showErrorToast = (msg) => {
    setToast({ show: true, message: msg, type: "error" });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };
  const showInfoToast = (msg) => {
    setToast({ show: true, message: msg, type: "info" });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    setShowInfoBlock(false);
    setSelectedArticle(null);
    try {
      let result;
      if (selectedMenu === "home") {
        result = await fetchTopHeadlines();
      } else {
        const category = getCategoryFromMenu(selectedMenu);
        result = await fetchArticlesByTopic(category);
      }
      try {
        await loadArticles();
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

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      loadArticles();
      return;
    }
    try {
      setLoading(true);
      setError(null);

      let data;
      if (selectedMenu === "home") {
        data = await getTopHeadlines();
        const filteredArticles = data.filter(
          (article) =>
            article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            article.content?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setArticles(filteredArticles);
      } else {
        const index = getCategoryFromMenu(selectedMenu);
        const results = await searchArticles(searchQuery, index);
        setArticles(results);
      }
    } catch (err) {
      setError(err.message);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedMenu, loadArticles, getCategoryFromMenu]);

  const onInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear search input and show all articles
  const handleClear = () => {
    setSearchQuery("");
    loadArticles();
  };

  // Load articles on tab change or when search is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      loadArticles();
    }
  }, [loadArticles, searchQuery]);

  const handleRowClick = (article) => {
    if (
      selectedArticle &&
      selectedArticle.url === article.url &&
      showInfoBlock
    ) {
      setShowInfoBlock(false);
      setSelectedArticle(null);
    } else {
      setSelectedArticle(article);
      setShowInfoBlock(true);
    }
  };

  const handleMenuSelect = (menu) => {
    setSelectedMenu(menu);
    setSearchQuery("");
    setShowInfoBlock(false);
    setSelectedArticle(null);
    setSelectedMenu(menu);

    // Scroll to top of main content
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="App">
      <Menu
        onSelectMenu={handleMenuSelect}
        selectedMenu={selectedMenu}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* SCROLLABLE MAIN CONTENT AREA */}
      <div
        className={`main-content ${
          isSidebarCollapsed ? "main-content-collapsed" : ""
        }`}
        ref={mainContentRef}
      >
        <div className="category-header">
          <h1 className="category-title">
            {getCategoryDisplayName(selectedMenu)}
          </h1>
          <p className="category-subtitle">
            {getCategorySubtitle(selectedMenu)}
          </p>
        </div>

        <Search
          value={searchQuery}
          onInputChange={onInputChange}
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          loading={loading}
          refreshing={refreshing}
          placeholder={`Search ${getCategoryDisplayName(
            selectedMenu
          ).toLowerCase()} articles...`}
          onClear={handleClear}
          autoFocus={true}
        />

        {/* Show chart for tabs with subcategories except for topic "general" */}
        {tabsWithSubcategory.includes(selectedMenu) &&
          selectedMenu !== "general" &&
          !searchQuery.trim() && (
            <div className="subcategory-chart-wrapper">
              <SubcategoryChart topic={selectedMenu} />
            </div>
          )}

        {/* Show CategoryChart for home tab */}
        {selectedMenu === "home" && !searchQuery.trim() && (
          <div className="category-chart-wrapper">
            <CategoryChart />
          </div>
        )}

        <div
          className={`content-wrapper${showInfoBlock ? " gap-visible" : ""}`}
        >
          {selectedMenu === "general" && (
            <div
              className={`table-container${
                showInfoBlock ? " table-shrink" : ""
              }`}
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
                </div>
              ) : (
                <>
                  {searchQuery.trim() && (
                    <div className="search-results-info">
                      <p>
                        Found {articles.length} article
                        {articles.length !== 1 ? "s" : ""} for "{searchQuery}"
                        in {getCategoryDisplayName(selectedMenu).toLowerCase()}
                      </p>
                    </div>
                  )}
                  {isMobile ? (
                    <Cards data={articles} onRowClick={handleRowClick} />
                  ) : (
                    <Table data={articles} onRowClick={handleRowClick} />
                  )}
                </>
              )}
            </div>
          )}

          {/* Info block remains visible if needed */}
          <div
            className={`right-blocks info-block-animated${
              showInfoBlock ? " visible" : ""
            }`}
          >
            <div className="info-block">
              {selectedArticle ? (
                <>
                  <div className="info-block-header">
                    <h3>Article Details</h3>
                    <button
                      className="close-info-btn"
                      onClick={() => {
                        setShowInfoBlock(false);
                        setSelectedArticle(null);
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="info-block-content">
                    <div className="article-field">
                      <strong>Title:</strong>
                      <p>{selectedArticle.title}</p>
                    </div>

                    <div className="article-field">
                      <strong>Category:</strong>
                      <span className="category-tag">
                        {selectedMenu === "home"
                          ? selectedArticle.category || "General"
                          : getCategoryDisplayName(selectedMenu)}
                      </span>
                    </div>

                    {selectedMenu !== "home" && selectedArticle.subcategory && (
                      <div className="article-field">
                        <strong>Subcategory:</strong>
                        <span className="subcategory-tag">
                          {selectedArticle.subcategory}
                        </span>
                      </div>
                    )}

                    <div className="article-field">
                      <strong>Description:</strong>
                      <p>
                        {selectedArticle.description ||
                          "No description available"}
                      </p>
                    </div>

                    <div className="article-field">
                      <strong>Published:</strong>
                      <p>
                        {selectedArticle.publishedAt
                          ? new Date(
                              selectedArticle.publishedAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>

                    <div className="article-field">
                      <strong>Source:</strong>
                      <a
                        href={selectedArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-link"
                      >
                        Read Full Article →
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="info-block-header">
                    <h3>Article Details</h3>
                    <button
                      className="close-info-btn"
                      onClick={() => setShowInfoBlock(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="info-block-content">
                    <p>Select an article to view details here.</p>
                  </div>
                </>
              )}
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
