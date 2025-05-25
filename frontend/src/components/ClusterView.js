import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function ClusterView() {
  const [clusters, setClusters] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/clusters')
      .then(res => res.json())
      .then(data => setClusters(data));
  }, []);

  return (
    <div>
      <h2>Tech News Clusters</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {clusters.map(cluster => (
          <div key={cluster.cluster_id} style={{ margin: '10px', padding: '10px', border: '1px solid #ccc' }}>
            <h3>Cluster {cluster.cluster_id}</h3>
            <p>Keywords: {cluster.keywords.join(', ')}</p>
            <p>Articles: {cluster.articles.length}</p>
          </div>
        ))}
      </div>

      {/* Simple Map (Optional) */}
      <div style={{ height: '500px', marginTop: '20px' }}>
        <MapContainer center={[37.8, -96]} zoom={4} style={{ height: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {clusters.flatMap(cluster => 
            cluster.articles.slice(0, 3).map((_, i) => (
              <Marker 
                key={`${cluster.cluster_id}-${i}`} 
                position={[37.8 + Math.random() * 10, -96 + Math.random() * 20]} // Mock coordinates
              >
                <Popup>Cluster {cluster.cluster_id}</Popup>
              </Marker>
            ))
          )}
        </MapContainer>
      </div>
    </div>
  );
}