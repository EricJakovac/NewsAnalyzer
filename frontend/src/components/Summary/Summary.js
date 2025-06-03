import React from 'react';
import Table from '../Table/Table';

const Summary = ({ articles }) => {
  const handleRowClick = (article) => {
    console.log('Selected article:', article);
    // Same detail view as Home
  };

  return (
    <div className="summary-container">
      <Table data={articles} onRowClick={handleRowClick} />
    </div>
  );
};

export default Summary;
