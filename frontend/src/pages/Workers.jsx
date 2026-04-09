import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WorkerCard from '../components/WorkerCard';
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

      const response = await axios.get(`/api/workers/search?${params}`);
      setWorkers(response.data.workers);
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
    fetchWorkers();
  }, [filters]);

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

  return (
    <div className="workers-page">
      <div className="container">
        <h1>Find Workers</h1>
        
        <div className="filters">
          <div className="filter-group">
            <input
              type="text"
              name="skill"
              placeholder="Skill (e.g., plumber)"
              value={filters.skill}
              onChange={handleFilterChange}
            />
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={filters.location}
              onChange={handleFilterChange}
            />
            <input
              type="number"
              name="minRating"
              placeholder="Min Rating"
              min="0"
              max="5"
              step="0.1"
              value={filters.minRating}
              onChange={handleFilterChange}
            />
            <input
              type="number"
              name="maxRate"
              placeholder="Max Rate ($/hr)"
              min="0"
              value={filters.maxRate}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading workers...</div>
        ) : (
          <>
            <div className="results-info">
              <p>Found {pagination.total} workers</p>
            </div>
            
            <div className="workers-grid">
              {workers.map(worker => (
                <WorkerCard key={worker._id} worker={worker} />
              ))}
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