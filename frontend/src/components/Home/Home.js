import React from "react";
import Table from "../Table/Table";
import Cards from "../Cards/Cards";

const Home = ({ articles }) => {
  const isMobile = window.innerWidth < 768;

  const handleRowClick = (article) => {
    console.log("Selected article:", article);
  };

  return (
    <>
      {isMobile ? (
        <Cards data={articles} onRowClick={handleRowClick} />
      ) : (
        <Table data={articles} onRowClick={handleRowClick} />
      )}
    </>
  );
};

export default Home;
