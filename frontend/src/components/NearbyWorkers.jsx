import React, { useEffect, useState } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import MapUI from './MapUI';
import useLocationSearch, { RADIUS_OPTIONS } from '../hooks/useLocationSearch';

const NearbyWorkers = () => {
  const {
    coordinates,
    radiusKm,
    setRadiusKm,
    loadingLocation,
    locationError,
    setLocationError
  } = useLocationSearch({ defaultMode: 'current' });
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    const fetchNearbyData = async () => {
      if (!coordinates?.lat || !coordinates?.lng) return;

      setLoadingResults(true);
      setLocationError('');

      try {
        const response = await api.get('/nearby', {
          params: {
            lat: coordinates.lat,
            lng: coordinates.lng,
            radius: radiusKm,
            limit: 20
          }
        });

        console.log('API Response (nearby):', response.data);
        setWorkers(Array.isArray(response.data.workers) ? response.data.workers : []);
        setJobs(Array.isArray(response.data.jobs) ? response.data.jobs : []);
      } catch (fetchError) {
        console.error('Nearby matching failed:', fetchError);
        setWorkers([]);
        setJobs([]);
        setLocationError(fetchError.response?.data?.message || 'Unable to fetch nearby results.');
      } finally {
        setLoadingResults(false);
      }
    };

    fetchNearbyData();
  }, [coordinates, radiusKm]);

  return (
    <div className="nearby-workers-module mt-30 glass-panel p-20">
      <h3 className="section-heading mb-15">Smart Location-Based Matching</h3>

      <div className="flex-wrap-gap mb-15" style={{ display: 'flex', alignItems: 'center' }}>
        <select
          value={radiusKm}
          onChange={(event) => setRadiusKm(Number(event.target.value))}
          className="text-input"
          style={{ maxWidth: '160px', margin: 0 }}
        >
          {RADIUS_OPTIONS.map((radius) => (
            <option key={radius} value={radius}>
              {radius} km
            </option>
          ))}
        </select>
      </div>

      {loadingLocation && <p className="text-muted mb-10">Resolving location...</p>}
      {locationError && <p className="text-red-500 mb-10">⚠️ {locationError}</p>}
      {coordinates && (
        <p className="text-sm mb-10">
          Center: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)} | Radius: {radiusKm} km
        </p>
      )}

      <MapUI userLocation={coordinates} workers={workers} jobs={jobs} />

      <div className="mt-15">
        <h4 className="mb-10">Nearby Workers</h4>

        {loadingResults ? (
          <p className="text-muted">Fetching nearby workers...</p>
        ) : workers.length === 0 && coordinates ? (
          <p className="text-muted">No nearby workers found in selected radius.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(Array.isArray(workers) ? workers : []).map((worker) => (
              <motion.div
                key={worker._id}
                className="glass-subpanel p-12 flex-between align-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div>
                  <p className="m-0 text-active">
                    <strong>{worker.user?.name || 'Worker'}</strong>
                  </p>
                  <p className="m-0 text-sm">{worker.skills?.join(', ') || 'No skills listed'}</p>
                </div>
                <div className="text-right">
                  <p className="m-0 text-green">₹{worker.hourlyRate || 0}/hr</p>
                  <span className="stat-pill text-xs">
                    {(worker.distanceInMeters / 1000).toFixed(1)} km away
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyWorkers;
