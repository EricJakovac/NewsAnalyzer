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
  searchTopHeadlines,
} from "./api/NewsAPI";
import Toast from "./components/Toast/Toast";
import SubcategoryChart from "./components/Charts/SubcategoryChart";
import CategoryChart from "./components/Charts/CategoryChart";
import Cards from "./components/Cards/Cards";
import Auth from "./components/Auth/Auth";
import Analytics from "./components/Analytics/Analytics";
import Recommendation from "./components/Recommendation/Recommendation";

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
  const [refreshKey, setRefreshKey] = useState(0); // Služi za resetiranje grafikona

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
      auth: "Google Analytics Authentication",
      general: "General",
      business: "Business",
      entertainment: "Entertainment",
      health: "Health",
      science: "Science",
      sports: "Sports",
      technology: "Technology",
      analytics: "Analytics Dashboard",
      recommendation: "Personalized Recommendations",
    };
    return displayMap[menu] || "Home";
  }, []);

  // Subtitles for categories
  const getCategorySubtitle = useCallback((menu) => {
    const subtitleMap = {
      home: "Breaking stories that shape your world today",
      auth: "Manage your Google OAuth connection and session cookies",
      general: "General world news and trending topics",
      business: "Latest market moves and business insights",
      entertainment: "Your daily dose of entertainment buzz",
      health: "Wellness updates and health breakthroughs",
      science: "Discoveries that change everything",
      sports: "Game-changing moments and athletic achievements",
      technology: "Innovation and tech breakthroughs that matter",
      analytics: "Visualize and understand user behavior with data",
      recommendation: "Articles tailored to your reading habits",
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
    if (["auth", "analytics"].includes(selectedMenu)) return; // Ne radi nista ako smo na auth ili anayltics tabu
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

      const articleCount = extractArticleCount(result.message);

      if (typeof articleCount === "number" && articleCount > 0) {
        // Delay za refresh podataka da se povuku novi
        await new Promise((resolve) => setTimeout(resolve, 500));
        await loadArticles();
        setRefreshKey((prev) => prev + 1);
        showSuccessToast(`Successfully fetched ${articleCount} new articles!`);
      } else {
        showInfoToast("You're up to date! No new articles found.");
      }
    } catch (err) {
      showErrorToast(`Failed to refresh: ${err.message}`);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [selectedMenu, getCategoryFromMenu, loadArticles]);

  const trackPageView = async (menuName) => {
    // 1. Ručno javljanje Google Analyticsu (GA4) o promjeni virtualne stranice
    const path = menuName === "home" ? "/" : `/${menuName}`;

    if (window.gtag && process.env.REACT_APP_GA_ID) {
      // 1. Prvo ažuriramo konfiguraciju (putanju i naslov)
      window.gtag("config", process.env.REACT_APP_GA_ID, {
        debug_mode: true,
        page_path: path,
        page_title: getCategoryDisplayName(menuName),
        send_page_view: false, // I dalje ostavljamo false ovdje da config ne pošalje dupli event
      });

      // 2. OVO NEDOSTAJE: Ručno slanje page_view događaja s novim podacima
      window.gtag("event", "page_view", {
        page_path: path,
        page_title: getCategoryDisplayName(menuName),
      });

      console.log(`[GA4] Tracked & Sent: ${path}`);
    }

    // 2. Tvoja postojeća logika za MongoDB (ne mijenjaj je)
    if (!user || (!user.id && !user.sub)) return;

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/analytics/track`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id || user.sub,
          page: menuName,
          device: window.innerWidth < 768 ? "mobile" : "desktop",
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("Greška pri slanju analitike u MongoDB:", err);
    }
  };

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

  const handleSearchTopHeadlines = async (searchQuery) => {
    try {
      const results = await searchTopHeadlines(searchQuery);
      setArticles(results); // Pretpostavljam da koristiš setArticles za prikaz rezultata
    } catch (error) {
      console.error("Error searching top headlines:", error);
      // Možeš dodati prikaz greške korisniku ako želiš
    }
  };

  const onInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear search input and show all articles
  const handleClear = () => {
    setSearchQuery("");
    loadArticles();
  };

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

  const handleSearchInput = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (selectedMenu === "home" && value.trim() !== "") {
      await handleSearchTopHeadlines(value);
    }
  };

  const handleMenuSelect = (menu) => {
    setSelectedMenu(menu);
    setSearchQuery("");
    setShowInfoBlock(false);
    setSelectedArticle(null);

    if (menu === "auth") return;

    // Scroll to top of main content
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const [user, setUser] = useState(null);

  // Funkcija za logout
  const handleLogout = () => {
    // Očisti localStorage prije nego što se redirecta
    localStorage.removeItem("user");
    setUser(null);
    setSelectedMenu("home");
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/logout`;
  };

  // Load articles on tab change or when search is cleared
  useEffect(() => {
    if (
      selectedMenu === "auth" ||
      selectedMenu === "analytics" ||
      selectedMenu === "recommendation"
    )
      return; // Ne radi nista ako smo na auth ili analytics tabu
    if (!searchQuery.trim()) {
      loadArticles();
    }
  }, [loadArticles, searchQuery]);

  // Analytics tracking - poziva se pri svakoj promjeni izbornika
  useEffect(() => {
    // 1. Google Analytics - prati SVE (uključujući analytics i recommendation)
    if (selectedMenu && selectedMenu !== "auth") {
      trackPageView(selectedMenu);
    }

    // 2. Interni MongoDB Tracking - zadržava tvoja pravila o ignoriranju
    const ignoredTabsForDB = ["auth", "analytics", "recommendation"];
    if (selectedMenu && user && !ignoredTabsForDB.includes(selectedMenu)) {
      console.log(
        `[DB-TRACKING] User ${user.id || user.sub} visited: ${selectedMenu}`
      );
      // Ovdje ide tvoj poziv prema backendu/bazi
    }
  }, [selectedMenu, user]); // Dodaj user ovdje da se interni log opali kad se on učita

  // User authentication and session management
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authSuccess = params.get("auth");
    const userDataB64 = params.get("user"); // 1. Brzi prikaz iz URL-a (da korisnik ne čeka fetch)

    // Korak 1: Ako je user data proslijeđen kao base64 u URL (iz /auth/callback)
    if (userDataB64) {
      try {
        const userData = JSON.parse(atob(userDataB64));
        setUser(userData);
        // Spremi u localStorage za buduće refresh-e
        localStorage.setItem("user", JSON.stringify(userData));
        console.log(
          "User data from URL decoded and saved to localStorage:",
          userData
        );
      } catch (e) {
        console.error("Failed to parse user data from URL:", e);
      }
    }
    // Korak 2: Ako nema URL data, provjeri localStorage (nakon refresh-a)
    else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log("User loaded from localStorage:", userData);
        } catch (e) {
          console.error("Failed to parse stored user data:", e);
          localStorage.removeItem("user");
        }
      }
    }

    // Korak 3: Fallback - ako nema URL ili localStorage, provjeri session na backendu
    const checkUser = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
          credentials: "include",
        });

        if (res.ok) {
          const userData = await res.json();
          console.log("User retrieved from session:", userData);
          setUser(userData);
          // Spremi u localStorage kao backup
          localStorage.setItem("user", JSON.stringify(userData));
          if (authSuccess === "success") {
            setSelectedMenu("home");
          }
        } else {
          // Ako nema session i nema URL data, ali je localStorage dostupan - koristi to
          // (ne postavljaj setUser(null) ako je korisnik već u localStorage)
          const storedUser = localStorage.getItem("user");
          if (!storedUser && res.status === 401) {
            console.log("User not found in session or localStorage");
          }
        }
      } catch (e) {
        console.error("Error checking session:", e);
      } finally {
        if (authSuccess === "success") {
          window.history.replaceState({}, document.title, "/");
        }
      }
    };

    checkUser();
  }, []);

  return (
    <div className="App">
      <Menu
        onSelectMenu={handleMenuSelect}
        selectedMenu={selectedMenu}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        user={user}
        onLogout={handleLogout}
      />

      {/* SCROLLABLE MAIN CONTENT AREA */}
      <div
        className={`main-content ${
          isSidebarCollapsed ? "main-content-collapsed" : ""
        } ${selectedMenu === "auth" ? "auth-page-active" : ""}`}
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
        {/* JEDNOSTAVNA LOGIKA ZA STRANICE KOJE NISU LISTE VIJESTI */}
        {selectedMenu === "auth" ? (
          <div className="auth-page-wrapper">
            <Auth user={user} onLogout={handleLogout} />
          </div>
        ) : selectedMenu === "analytics" ? (
          <div className="analytics-page-wrapper">
            <Analytics />
          </div>
        ) : selectedMenu === "recommendation" ? (
          <div className="recommendation-page-wrapper">
            <Recommendation isFullPage={true} />
          </div>
        ) : (
          <>
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
                  <SubcategoryChart key={refreshKey} topic={selectedMenu} />
                </div>
              )}

            {/* Show CategoryChart for home tab */}
            {selectedMenu === "home" && !searchQuery.trim() && (
              <div className="category-chart-wrapper">
                <CategoryChart key={refreshKey} />
              </div>
            )}

            <div
              className={`content-wrapper${
                showInfoBlock ? " gap-visible" : ""
              }`}
            >
              {/* DODAJ OVAJ BLOK - Show Table for other subcategory tabs when searching */}
              {tabsWithSubcategory.includes(selectedMenu) &&
                selectedMenu !== "general" &&
                selectedMenu !== "home" &&
                searchQuery.trim() && (
                  <div
                    className={`table-container${
                      showInfoBlock ? " table-shrink" : ""
                    }`}
                  >
                    {loading ? (
                      <div className="loading">
                        <p>
                          Searching{" "}
                          {getCategoryDisplayName(selectedMenu).toLowerCase()}{" "}
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
                          No articles found for "{searchQuery}" in{" "}
                          {getCategoryDisplayName(selectedMenu).toLowerCase()}.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="search-results-info">
                          <p>
                            Found {articles.length} article
                            {articles.length !== 1 ? "s" : ""} for "
                            {searchQuery}" in{" "}
                            {getCategoryDisplayName(selectedMenu).toLowerCase()}
                          </p>
                        </div>
                        <Table
                          data={articles}
                          onRowClick={handleRowClick}
                          showAdditionalButtons={!showInfoBlock}
                        />
                      </>
                    )}
                  </div>
                )}
              {/* Show Table with search results for home tab when searching */}
              {selectedMenu === "home" && searchQuery.trim() && (
                <div className="table-container">
                  {loading ? (
                    <div className="loading">
                      <p>Searching top headlines...</p>
                    </div>
                  ) : error ? (
                    <div className="error">
                      <p>Can't load data. Please refresh again.</p>
                    </div>
                  ) : articles.length === 0 ? (
                    <div className="no-results">
                      <p>No top headlines found for "{searchQuery}".</p>
                    </div>
                  ) : (
                    <>
                      <div className="search-results-info">
                        <p>
                          Found {articles.length} article
                          {articles.length !== 1 ? "s" : ""} for "{searchQuery}"
                          in top headlines
                        </p>
                      </div>
                      <Table
                        data={articles}
                        onRowClick={handleRowClick}
                        showAdditionalButtons={!showInfoBlock}
                      />
                    </>
                  )}
                </div>
              )}
              {selectedMenu === "general" && (
                <div
                  className={`table-container${
                    showInfoBlock ? " table-shrink" : ""
                  }`}
                >
                  {loading ? (
                    <div className="loading">
                      <p>
                        Loading{" "}
                        {getCategoryDisplayName(selectedMenu).toLowerCase()}{" "}
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
                            {articles.length !== 1 ? "s" : ""} for "
                            {searchQuery}" in{" "}
                            {getCategoryDisplayName(selectedMenu).toLowerCase()}
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
                        ></button>
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

                        {selectedMenu !== "home" &&
                          selectedArticle.subcategory && (
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
                        ></button>
                      </div>
                      <div className="info-block-content">
                        <p>Select an article to view details here.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
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
