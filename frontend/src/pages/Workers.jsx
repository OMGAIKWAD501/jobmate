import React, { useState, useEffect } from 'react';
import api from '../api';
import WorkerCard from '../components/WorkerCard';
import useLocationSearch, { RADIUS_OPTIONS } from '../hooks/useLocationSearch';
import './Workers.css';

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    skill: '',
    location: '',
    minRating: '',
    maxRate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });
  const {
    locationMode,
    setLocationMode,
    manualQuery,
    setManualQuery,
    coordinates,
    radiusKm,
    setRadiusKm,
    loadingLocation,
    locationError,
    setLocationError,
    resolveCurrentLocation,
    resolveManualLocation,
    clearLocation
  } = useLocationSearch({ defaultMode: 'none' });

  const fetchWorkers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 12,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await api.get(`/workers/search?${params}`);
      console.log('API Response (workers/search):', response.data);
      const fetchedWorkers = response.data.workers;
      setWorkers(Array.isArray(fetchedWorkers) ? fetchedWorkers : []);
      setPagination({
        page: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coordinates) return;
    fetchWorkers();
  }, [filters, coordinates]);

  useEffect(() => {
    const fetchNearbyWorkers = async () => {
      if (!coordinates?.lat || !coordinates?.lng) return;

      setLoading(true);
      try {
        const response = await api.get('/nearby', {
          params: {
            lat: coordinates.lat,
            lng: coordinates.lng,
            radius: radiusKm,
            limit: 20
          }
        });

        console.log('API Response (nearby workers):', response.data);
        const nearbyWorkers = Array.isArray(response.data.workers) ? response.data.workers : [];
        setWorkers(nearbyWorkers);
        setPagination({
          page: 1,
          totalPages: 1,
          total: nearbyWorkers.length
        });
      } catch (error) {
        console.error('Error fetching nearby workers:', error);
        setWorkers([]);
        setPagination({
          page: 1,
          totalPages: 1,
          total: 0
        });
        setLocationError(error.response?.data?.message || 'Unable to fetch nearby workers.');
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyWorkers();
  }, [coordinates, radiusKm]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePageChange = (newPage) => {
    fetchWorkers(newPage);
  };

  const clearNearby = () => {
    clearLocation();
    fetchWorkers(1);
  };

  return (
    <div className="workers-page">
      <div className="container">
        <h1>Find Workers</h1>
        
        <div className="filters">
          <div className="filter-group" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              name="skill"
              placeholder="Skill (e.g., plumber)"
              value={filters.skill}
              onChange={handleFilterChange}
              style={{ minWidth: '220px' }}
            />
            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                setLocationMode('current');
                resolveCurrentLocation({ preferCache: false });
              }}
            >
              {loadingLocation ? 'Getting location...' : 'Find Nearby Workers'}
            </button>
            <button className="btn-secondary" type="button" onClick={() => setLocationMode('manual')}>
              Manual Location
            </button>
            <button className="btn-secondary" type="button" onClick={clearNearby}>
              Clear Nearby
            </button>

            <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))}>
              {RADIUS_OPTIONS.map((radius) => (
                <option key={radius} value={radius}>{radius} km</option>
              ))}
            </select>
          </div>
          {locationMode === 'manual' && (
            <form onSubmit={resolveManualLocation} style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Enter city or pincode"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
              />
              <button type="submit" className="btn-primary">Search Nearby</button>
            </form>
          )}
          {locationError && <p className="text-red-500">{locationError}</p>}
        </div>

        {loading ? (
          <div className="loading">Loading workers...</div>
        ) : (
          <>
            <div className="results-info">
              <p>
                Found {pagination.total} workers
                {coordinates ? ` within ${radiusKm} km` : ''}
              </p>
            </div>
            
            <div className="workers-grid">
              {Array.isArray(workers) ? workers.map(worker => (
                <WorkerCard key={worker._id} worker={worker} />
              )) : <p className="text-muted">No workers available</p>}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="btn-secondary"
                >
                  Previous
                </button>
                
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                
                <button 
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Workers;