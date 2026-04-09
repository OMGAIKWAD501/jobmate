import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon in leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl
});

const MapUI = ({ jobs }) => {
  // Center map to a default or first job's location
  const center = jobs.length > 0 && jobs[0].geometry?.coordinates 
    ? [jobs[0].geometry.coordinates[1], jobs[0].geometry.coordinates[0]]
    : [40.7128, -74.0060]; // Default to New York

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {jobs.map(job => {
          if (job.geometry && job.geometry.coordinates) {
            const [lng, lat] = job.geometry.coordinates;
            return (
              <Marker key={job._id} position={[lat, lng]}>
                <Popup>
                  <strong>{job.title}</strong><br />
                  ${job.budget} • {job.duration}
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default MapUI;
