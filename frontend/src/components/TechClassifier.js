import React, { useState } from 'react';

export default function TechClassifier() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);

  const handleClassify = () => {
    fetch('http://localhost:5000/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input })
    })
      .then(res => res.json())
      .then(data => setResult(data.tech_type));
  };

  return (
    <div style={{ margin: '20px' }}>
      <h2>Tech Type Classifier</h2>
      <input 
        type="text" 
        value={input} 
        onChange={(e) => setInput(e.target.value)} 
        placeholder="Enter tech headline..."
        style={{ width: '300px', padding: '8px' }}
      />
      <button onClick={handleClassify} style={{ marginLeft: '10px', padding: '8px' }}>
        Classify
      </button>
      {result && (
        <p style={{ marginTop: '10px' }}>
          Result: <strong>{result}</strong>
        </p>
      )}
    </div>
  );
}