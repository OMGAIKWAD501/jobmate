import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import useLocationSearch, { RADIUS_OPTIONS } from '../hooks/useLocationSearch';
import './Jobs.css';

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [workerSkills, setWorkerSkills] = useState([]);
  const [activeTab, setActiveTab] = useState('matched'); // 'matched' | 'all'
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

  const fetchJobs = useCallback(async (tab = activeTab) => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (user?.role === 'worker') {
        if (tab === 'matched') {
          response = await api.get('/jobs/recommended/for-worker');
          setWorkerSkills(response.data.workerSkills || []);
          setJobs(Array.isArray(response.data.jobs) ? response.data.jobs : []);
        } else {
          // All jobs tab — also fetch worker skills for badge highlighting
          const [allRes, matchedRes] = await Promise.all([
            api.get('/jobs'),
            api.get('/jobs/recommended/for-worker')
          ]);
          setWorkerSkills(matchedRes.data.workerSkills || []);
          setJobs(Array.isArray(allRes.data.jobs) ? allRes.data.jobs : []);
        }
      } else {
        response = await api.get('/jobs');
        setJobs(Array.isArray(response.data.jobs) ? response.data.jobs : []);
      }
      setInfoMessage('');
      setEffectiveRadiusKm(null);
    } catch (err) {
      setError('Unable to load jobs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.role, activeTab]);

  useEffect(() => {
    fetchJobs(activeTab);
    fetchAppliedJobIds();
  }, [user?.role, activeTab]);

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
          const fallback = activeTab === 'matched' && user?.role === 'worker'
            ? await api.get('/jobs/recommended/for-worker')
            : await api.get('/jobs');
          setJobs(Array.isArray(fallback.data.jobs) ? fallback.data.jobs : []);
          setEffectiveRadiusKm(null);
          setInfoMessage(`No nearby jobs found within ${radiusSequence[radiusSequence.length - 1]} km. Showing ${activeTab === 'matched' && user?.role === 'worker' ? 'skill-matched' : 'latest open'} jobs instead.`);
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
    fetchJobs(activeTab);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setJobs([]);
    setError('');
    setInfoMessage('');
  };

  // Check if a job matches worker skills (for badge in All Jobs tab)
  const isSkillMatch = (job) => {
    if (!workerSkills.length) return false;
    const lowerSkills = workerSkills.map(s => s.toLowerCase());
    return (job.requiredSkills || []).some(s => lowerSkills.includes(s.toLowerCase()));
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

  const isWorker = user?.role === 'worker';

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

        {isWorker && activeTab === 'matched' && (
          <p className="skill-filter-notice">
            ✅ Showing only jobs that match your registered skills.
          </p>
        )}
        {isWorker && activeTab === 'all' && (
          <p className="skill-filter-notice all-jobs-notice">
            🌐 Showing all open jobs. Jobs matching your skills are highlighted.
          </p>
        )}

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

            {/* Skill filter tabs — right after Find Nearby Jobs */}
            {isWorker && (
              <>
                <div className="toolbar-divider" />
                <button
                  className={`jobs-tab toolbar-control ${activeTab === 'matched' ? 'active' : ''}`}
                  onClick={() => handleTabChange('matched')}
                >
                  ⚡ Matched Skills
                </button>
                <button
                  className={`jobs-tab toolbar-control ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => handleTabChange('all')}
                >
                  🌐 All Jobs
                </button>
                <div className="toolbar-divider" />
              </>
            )}

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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state">
            {isWorker && activeTab === 'matched'
              ? (
                <>
                  <p style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</p>
                  <p style={{ fontWeight: 600, marginBottom: 8 }}>No skill-matched jobs found.</p>
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                    Switch to <strong>All Jobs</strong> to browse everything, or update your skills in your profile.
                  </p>
                  <button
                    className="btn-primary"
                    style={{ marginTop: '16px' }}
                    onClick={() => handleTabChange('all')}
                  >
                    Browse All Jobs
                  </button>
                </>
              )
              : <p>No jobs found. Please check back later.</p>
            }
          </motion.div>
        )}

        <div className="jobs-grid">
          <AnimatePresence mode="wait">
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
              jobs.map((job, idx) => {
                const matched = isWorker && activeTab === 'all' && isSkillMatch(job);
                return (
                  <motion.div
                    key={job._id}
                    className={`job-card glass-panel${matched ? ' skill-matched-card' : ''}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.07, type: 'spring' }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="job-card-header">
                      <h3>{job.title}</h3> 
                      <div className="job-card-badges">
                        {matched && (
                          <span className="skill-match-badge">⚡ Skill Match</span>
                        )}
                        <span className={`status-badge ${job.status}`}>{job.status}</span>
                      </div>
                    </div>

                    <p className="job-location"><span className="icon">📍</span> {job.location}</p>

                    <div className="job-skills">
                      {(Array.isArray(job.requiredSkills) ? job.requiredSkills : []).map((skill, skillIndex) => {
                        const isMySkill = workerSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                        return (
                          <span
                            key={`${job._id}-skill-${skillIndex}`}
                            className={`skill-tag${isMySkill ? ' skill-tag-match' : ''}`}
                          >
                            {skill}
                          </span>
                        );
                      })}
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
                );
              })
            ) : <p className="text-muted" style={{ gridColumn: '1 / -1' }}>No available jobs.</p>}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Jobs;
