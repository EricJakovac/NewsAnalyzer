import React from "react";
import Table from "../Table/Table";
import Cards from "../Cards/Cards";

const GeneralArticles = ({
  loading,
  error,
  articles,
  searchQuery,
  isMobile,
  handleRowClick,
  showInfoBlock,
}) => {
  
  // 1. Ako imamo ERROR i nemamo nikakvih članaka od prije, pokaži samo error
  if (error && articles.length === 0) {
    return (
      <div className="error">
        <p>Error loading general articles.</p>
      </div>
    );
  }

  // 2. Ako je LOADING i nemamo nikakvih članaka (prvo učitavanje), pokaži loading tekst
  if (loading && articles.length === 0) {
    return (
      <div className="loading">
        <p>Loading general articles...</p>
      </div>
    );
  }

  // 3. Glavni prikaz: Tablica se prikazuje uvijek ako ima članaka, 
  // čak i dok se u pozadini radi novi fetch (loading je true)
  return (
    <div className={`table-container${showInfoBlock ? " table-shrink" : ""}`}>
      {articles.length === 0 && !loading ? (
        <div className="no-results">
          <p>
            {searchQuery.trim()
              ? `No articles found for "${searchQuery}".`
              : "No general articles found."}
          </p>
        </div>
      ) : (
        <>
          {searchQuery.trim() && (
            <div className="search-results-info">
              <p>
                Found {articles.length} article
                {articles.length !== 1 ? "s" : ""} for "{searchQuery}"
              </p>
            </div>
          )}
          
          {/* Ovdje možeš dodati mali diskretni spinner ako želiš, 
              ali tablica ostaje vidljiva */}
          {isMobile ? (
            <Cards data={articles} onRowClick={handleRowClick} />
          ) : (
            <Table data={articles} onRowClick={handleRowClick} />
          )}
        </>
      )}
    </div>
  );
};

export default GeneralArticles;