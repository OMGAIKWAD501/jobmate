import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import useLocationSearch, { RADIUS_OPTIONS } from '../hooks/useLocationSearch';
import './Jobs.css';

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [effectiveRadiusKm, setEffectiveRadiusKm] = useState(null);
  const [applyingJobIds, setApplyingJobIds] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const {
    setLocationMode,
    coordinates,
    radiusKm,
    setRadiusKm,
    loadingLocation,
    locationError,
    resolveCurrentLocation,
    clearLocation
  } = useLocationSearch({ defaultMode: 'none' });

  const fetchAppliedJobIds = async () => {
    if (user?.role !== 'worker') return;
    try {
      const response = await api.get('/jobs/my-applications');
      setAppliedJobIds(response.data.appliedJobIds || []);
    } catch (err) {
      console.error('Error fetching applied job ids:', err);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/jobs');
      console.log('API Response (jobs):', response.data);
      setJobs(Array.isArray(response.data.jobs) ? response.data.jobs : []);
      setInfoMessage('');
      setEffectiveRadiusKm(null);
    } catch (err) {
      setError('Unable to load jobs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchAppliedJobIds();
  }, [user?.role]);

  useEffect(() => {
    const fetchNearbyJobs = async () => {
      if (!coordinates?.lat || !coordinates?.lng) return;

      setLoading(true);
      setError('');
      setInfoMessage('');
      try {
        const radiusSequence = [radiusKm, 10, 20, 50].filter((value, index, arr) => (
          arr.indexOf(value) === index
        ));

        let nearbyJobs = [];
        let usedRadius = radiusKm;

        for (const radius of radiusSequence) {
          const response = await api.get('/nearby', {
            params: {
              lat: coordinates.lat,
              lng: coordinates.lng,
              radius,
              limit: 20
            }
          });
          const jobsFromRadius = Array.isArray(response.data.jobs) ? response.data.jobs : [];
          if (jobsFromRadius.length > 0) {
            nearbyJobs = jobsFromRadius;
            usedRadius = radius;
            break;
          }
        }

        if (nearbyJobs.length === 0) {
          const fallback = await api.get('/jobs');
          console.log('API Response (fallback jobs):', fallback.data);
          setJobs(Array.isArray(fallback.data.jobs) ? fallback.data.jobs : []);
          setEffectiveRadiusKm(null);
          setInfoMessage(`No nearby jobs found within ${radiusSequence[radiusSequence.length - 1]} km. Showing latest open jobs instead.`);
        } else {
          setJobs(nearbyJobs);
          setEffectiveRadiusKm(usedRadius);
          if (usedRadius !== radiusKm) {
            setInfoMessage(`No jobs found within ${radiusKm} km. Expanded search to ${usedRadius} km.`);
          }
        }
        await fetchAppliedJobIds();
      } catch (err) {
        console.error(err);
        setJobs([]);
        setError(err.response?.data?.message || 'Unable to load nearby jobs.');
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyJobs();
  }, [coordinates, radiusKm]);

  const clearNearby = () => {
    clearLocation();
    setEffectiveRadiusKm(null);
    fetchJobs();
  };

  const handleApply = async (jobId) => {
    if (!user) {
      alert('Please login as a worker to apply.');
      return;
    }

    if (user.role !== 'worker') {
      alert('Only workers can apply for jobs.');
      return;
    }

    if (applyingJobIds.includes(jobId) || appliedJobIds.includes(jobId)) return;

    setApplyingJobIds((prev) => [...prev, jobId]);
    try {
      await api.post(`/jobs/${jobId}/apply`, {
        message: 'Excited to take this job opportunity.'
      });
      alert('Application submitted successfully!');
      setAppliedJobIds((prev) => [...new Set([...prev, jobId])]);
      setJobs((prev) =>
        (Array.isArray(prev) ? prev : []).map((job) =>
          job._id === jobId
            ? {
                ...job,
                applications: [
                  ...(job.applications || []),
                  { worker: user.id || user._id, status: 'pending' }
                ]
              }
            : job
        )
      );
      await fetchAppliedJobIds();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Cannot apply at the moment.');
    } finally {
      setApplyingJobIds((prev) => prev.filter((id) => id !== jobId));
    }
  };

  return (
    <motion.div 
      className="jobs-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="container">
        <motion.h1 
          className="page-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Job Marketplace
        </motion.h1>

        <div className="glass-panel jobs-toolbar">
          <div className="jobs-toolbar-row">
            <button
              type="button"
              className="btn-primary toolbar-control"
              onClick={() => {
                setLocationMode('current');
                setInfoMessage('');
                setError('');
                setEffectiveRadiusKm(null);
                resolveCurrentLocation({ preferCache: false });
              }}
            >
              {loadingLocation ? 'Finding nearby...' : 'Find Nearby Jobs'}
            </button>
            <button type="button" className="btn-secondary toolbar-control" onClick={clearNearby}>
              Clear Nearby
            </button>

            <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="toolbar-control">
              {RADIUS_OPTIONS.map((radius) => (
                <option key={radius} value={radius}>{radius} km</option>
              ))}
            </select>
          </div>

          {coordinates && (
            <p className="toolbar-meta">
              Showing nearby jobs within {effectiveRadiusKm || radiusKm} km
            </p>
          )}
          {locationError && <p className="toolbar-error">{locationError}</p>}
          {infoMessage && <p className="toolbar-info">{infoMessage}</p>}
        </div>

        {error && <div className="error glass-panel">{error}</div>}

        {!loading && !error && jobs.length === 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state">
            No jobs found. Please check back later.
          </motion.p>
        )}

        <div className="jobs-grid">
          <AnimatePresence>
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <motion.div 
                  key={`skeleton-${i}`} 
                  className="glass-panel skeleton-card"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ height: '300px', animation: 'pulse 1.5s infinite' }}
                />
              ))
            ) : Array.isArray(jobs) ? (
              jobs.map((job, idx) => (
                <motion.div 
                  key={job._id} 
                  className="job-card glass-panel"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, type: 'spring' }}
                  whileHover={{ y: -5 }}
                >
                  <div className="job-card-header">
                    <h3>{job.title}</h3>
                    <span className={`status-badge ${job.status}`}>{job.status}</span>
                  </div>
                  
                  <p className="job-location"><span className="icon">📍</span> {job.location}</p>
                  
                  <div className="job-skills">
                    {(Array.isArray(job.requiredSkills) ? job.requiredSkills : []).map((skill, skillIndex) => (
                      <span key={`${job._id}-skill-${skillIndex}`} className="skill-tag">{skill}</span>
                    ))}
                  </div>

                  <p className="job-desc">
                    {((job.description || '').length > 120)
                      ? `${(job.description || '').slice(0, 120)}...`
                      : (job.description || 'No description provided.')}
                  </p>
                  
                  <div className="job-meta">
                    <span className="job-budget">💰 ₹{job.budget || 'N/A'}</span>
                    
                    {job.status === 'open' ? (
                      appliedJobIds.includes(job._id) ? (
                        <button className="btn-secondary apply-btn disabled" disabled>
                          Applied
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApply(job._id)}
                          className="btn-primary apply-btn"
                          disabled={applyingJobIds.includes(job._id)}
                        >
                          {applyingJobIds.includes(job._id) ? 'Applying...' : 'Apply Now'}
                        </button>
                      )
                    ) : (
                      <button className="btn-secondary apply-btn disabled" disabled>
                        Closed
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : <p className="text-muted" style={{ gridColumn: '1 / -1' }}>No available jobs.</p>}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Jobs;
