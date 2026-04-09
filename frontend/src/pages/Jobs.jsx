import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './Jobs.css';

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/jobs');
      setJobs(response.data.jobs);
    } catch (err) {
      setError('Unable to load jobs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleApply = async (jobId) => {
    if (!user) {
      alert('Please login as a worker to apply.');
      return;
    }

    if (user.role !== 'worker') {
      alert('Only workers can apply for jobs.');
      return;
    }

    try {
      await axios.post(`/api/jobs/${jobId}/apply`, {
        message: 'Excited to take this job opportunity.'
      });
      alert('Application submitted successfully!');
      fetchJobs();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Cannot apply at the moment.');
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
            ) : (
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
                    {job.requiredSkills.map(skill => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                  
                  <p className="job-desc">{job.description.length > 120 ? `${job.description.slice(0, 120)}...` : job.description}</p>
                  
                  <div className="job-meta">
                    <span className="job-budget">💰 ${job.budget || 'N/A'}</span>
                    
                    {job.status === 'open' ? (
                      <button
                        onClick={() => handleApply(job._id)}
                        className="btn-primary apply-btn"
                      >
                        Apply Now
                      </button>
                    ) : (
                      <button className="btn-secondary apply-btn disabled" disabled>
                        Closed
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Jobs;
