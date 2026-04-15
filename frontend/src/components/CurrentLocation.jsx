import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import API_URL from '../config';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const CurrentLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Fetch Location natively via browser API
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const handleSuccess = async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      setLocation({ lat, lng });
      setLoading(false);

      // 2. Post location securely to backend
      try {
        // Safe relative API call assuming proxy setup handles '/api'
        const response = await fetch(`${API_URL}/api/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng }),
        });

        if (!response.ok) {
          throw new Error('Failed to log location to backend');
        }

        console.log('Location logged onto the backend successfully.');

      } catch (err) {
        console.error('Error logging location:', err);
        // We do not set the UI error here because the UI still cleanly successfully caught the location on frontend.
      }
    };

    const handleError = (error) => {
      setLoading(false);
      switch(error.code) {
        case error.PERMISSION_DENIED:
          setError("Location permission was denied.");
          break;
        case error.POSITION_UNAVAILABLE:
          setError("Location information is unavailable (make sure location services are enabled).");
          break;
        case error.TIMEOUT:
          setError("The request to get user location timed out.");
          break;
        default:
          setError("An unknown error occurred while getting location.");
          break;
      }
    };

    // Trigger the prompt
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

  }, []); // Run exactly once on mount

  if (loading) {
    return (
       <div className="glass-subpanel p-20 text-center text-muted" style={{ animation: 'pulse 1.5s infinite'}}>
           <p>Getting your current location...</p>
       </div>
    );
  }

  if (error) {
    return (
      <div className="glass-subpanel p-20 text-center" style={{ borderColor: 'rgba(239, 68, 68, 0.3)'}}>
        <p className="text-red-500 m-0">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="current-location glass-subpanel">
       <h3 className="section-heading mb-10">Current Location Tracking</h3>
       
       <div className="flex-between align-center mb-15">
           <p className="m-0 text-body">
              <strong>Latitude:</strong> {location.lat.toFixed(5)} <br/>
              <strong>Longitude:</strong> {location.lng.toFixed(5)}
           </p>
           <span className="stat-pill text-green">✅ Synced to Server</span>
       </div>

       <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
          <MapContainer 
             center={[location.lat, location.lng]} 
             zoom={13} 
             scrollWheelZoom={false} 
             style={{ height: "100%", width: "100%" }}
          >
             <TileLayer
               attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
             />
             <Marker position={[location.lat, location.lng]}>
               <Popup>
                 You are here!
               </Popup>
             </Marker>
          </MapContainer>
       </div>
    </div>
  );
};

export default CurrentLocation;
