import React from 'react';
import TechClassifier from './components/TechClassifier';
import ClusterView from './components/ClusterView';

export default function App() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Tech News Analyzer</h1>
      <TechClassifier />
      <ClusterView />
    </div>
  );
}