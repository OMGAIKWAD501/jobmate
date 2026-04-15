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

const MapUI = ({ userLocation, workers = [], jobs = [] }) => {
  const defaultCenter = [20.5937, 78.9629]; // India
  const center = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>
              <strong>Your selected location</strong>
            </Popup>
          </Marker>
        )}

        {(Array.isArray(workers) ? workers : []).map((worker) => {
          const coords = worker?.location?.coordinates;
          if (!Array.isArray(coords) || coords.length !== 2) return null;

          const [lng, lat] = coords;
          return (
            <Marker key={`worker-${worker._id}`} position={[lat, lng]}>
              <Popup>
                <strong>{worker.user?.name || 'Worker'}</strong><br />
                {worker.skills?.join(', ') || 'No skills listed'}
              </Popup>
            </Marker>
          );
        })}

        {(Array.isArray(jobs) ? jobs : []).map((job) => {
          const coords = job?.geometry?.coordinates;
          if (!Array.isArray(coords) || coords.length !== 2) return null;

          const [lng, lat] = coords;
          return (
            <Marker key={`job-${job._id}`} position={[lat, lng]}>
              <Popup>
                <strong>{job.title}</strong><br />
                ₹{job.budget || 0} • {job.location}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapUI;
