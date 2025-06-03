import React from 'react';
import Table from '../Table/Table';

const Home = ({ articles }) => {
  const handleRowClick = (article) => {
    console.log('Selected article:', article);
    // You'll implement the detail view here later
  };

  return (
    <div className="home-container">
      <Table data={articles} onRowClick={handleRowClick} />
    </div>
  );
};

export default Home;
