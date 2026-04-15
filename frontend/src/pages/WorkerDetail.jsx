import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import DirectHireModal from '../components/DirectHireModal';
import './WorkerDetail.css';

const WorkerDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [applyingToJob, setApplyingToJob] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [hireModalOpen, setHireModalOpen] = useState(false);

  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchWorkerAndReviews = async () => {
      try {
        const workerRes = await axios.get(`${API_URL}/api/workers/${id}`);
        setWorker(workerRes.data);
        
        // Wait to fetch reviews using the actual user _id associated with the worker
        const workerUserId = workerRes.data.user?._id || workerRes.data.user?.id;
        const reviewsRes = await axios.get(`${API_URL}/api/workers/${workerUserId}/reviews`);
        console.log('API Response (reviews):', reviewsRes.data);
        setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
      } catch (error) {
        console.error('Error fetching worker details:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendedJobs = async () => {
      if (!worker) return;
      const currentUserId = user?.id || user?._id;
      const workerUserId = worker.user?._id || worker.user?.id;

      if (user && user.role === 'worker' && currentUserId === workerUserId) {
        try {
          const response = await axios.get(`${API_URL}/api/jobs/recommended/for-worker`);
          console.log('API Response (recommended jobs):', response.data);
          setRecommendedJobs(Array.isArray(response.data.jobs) ? response.data.jobs : []);
        } catch (error) {
          console.error('Error fetching recommended jobs:', error);
        }
      }
    };

    fetchWorkerAndReviews();
    if (user) {
      fetchRecommendedJobs();
    }
  }, [id, user]);

  const handleHire = () => {
    if (!user) {
      alert('Please login to hire workers');
      return;
    }

    if (user.role !== 'customer') {
      alert('Only customers can hire workers');
      return;
    }
    
    setHireModalOpen(true);
  };

  const handleApplyForJob = async (jobId) => {
    if (!user) {
      alert('Please login to apply for jobs');
      return;
    }

    if (user.role !== 'worker') {
      alert('Only workers can apply for jobs');
      return;
    }

    setApplyingToJob(jobId);

    try {
      await axios.post(`${API_URL}/api/jobs/${jobId}/apply`, {
        message: applicationMessage
      });

      setRecommendedJobs(prev => prev.filter(job => job._id !== jobId));
      
      setMessage('Application submitted successfully!');
      setApplicationMessage('');
      setApplyingToJob(null);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error applying for job:', error);
      alert('Error applying for job: ' + (error.response?.data?.message || 'Unknown error'));
      setApplyingToJob(null);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '60px' }}>
         <motion.div className="glass-panel" style={{ height: '500px', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (!worker) {
    return <div className="error glass-panel container" style={{ marginTop: '40px' }}>Worker not found</div>;
  }

  const { user: workerUser, skills, experience, hourlyRate, description, rating, completedJobs, availability } = worker;

  return (
    <motion.div 
      className="worker-detail"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container">
        <div className="worker-profile-card glass-panel flex-column-gap">
          <div className="profile-card-header">
            <div className="profile-avatar-container">
              <img 
                src={workerUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(workerUser.name)}&background=random`} 
                alt={workerUser.name} 
                className="profile-avatar" 
              />
              {rating >= 4.8 && <div className="top-rated-badge-detail">🔥 Top Rated</div>}
            </div>
            
            <div className="profile-info">
              <h1>{workerUser.name}</h1>
              <p className="location"><span className="icon">📍</span> {workerUser.location || 'Location not provided'}</p>
              <div className="stats align-center-gap">
                <span className="rating stat-pill">⭐ {Number(rating || 0).toFixed(1)} Rating</span>
                <span className="jobs stat-pill">💼 {completedJobs || 0} Jobs</span>
                <span className={`availability stat-pill ${availability}`}>
                  {availability === 'available' ? '✅ Available' : '⏳ Busy'}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-details-grid">
            <div className="section glass-subpanel">
              <h2 className="section-heading">Skills</h2>
              <div className="skills flex-wrap-gap">
                {(Array.isArray(skills) ? skills : []).map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
                {(!skills || skills.length === 0) && (
                  <span className="text-muted">No skills listed</span>
                )}
              </div>
            </div>

            {experience > 0 && (
              <div className="section glass-subpanel">
                <h2 className="section-heading">Experience</h2>
                <p className="text-large">{experience} years</p>
              </div>
            )}

            {hourlyRate && (
              <div className="section glass-subpanel">
                <h2 className="section-heading">Hourly Rate</h2>
                <p className="text-large text-green">₹{hourlyRate} <span className="text-sm text-muted">/hr</span></p>
              </div>
            )}

            {description && (
              <div className="section glass-subpanel full-width">
                <h2 className="section-heading">About</h2>
                <p className="text-body leading-relaxed">{description}</p>
              </div>
            )}

            {workerUser.phone && (
              <div className="section glass-subpanel">
                <h2 className="section-heading">Contact</h2>
                <p className="text-large">{workerUser.phone}</p>
              </div>
            )}

            {/* REVIEWS SECTION */}
            <div className="section glass-subpanel full-width reviews-section">
              <h2 className="section-heading">Reviews ({reviews.length})</h2>
              {reviews.length > 0 ? (
                <div className="reviews-list list-gap">
                  {Array.isArray(reviews) ? reviews.map(review => (
                    <div key={review._id} className="review-card">
                      <div className="flex-between align-center mb-10">
                        <div className="align-center-gap">
                           <img 
                             src={review.customer?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.customer?.name || 'C')}&background=random`} 
                             alt={review.customer?.name} 
                             style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                           />
                           <h4 className="m-0 text-active">{review.customer?.name || 'Customer'}</h4>
                        </div>
                        <span className="rating-pill text-sm">⭐ {review.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-muted text-xs mb-10">For job: {review.job?.title || 'Unknown Job'} • {new Date(review.createdAt).toLocaleDateString()}</p>
                      <p className="text-body italic m-0">"{review.comment}"</p>
                    </div>
                  )) : <p className="text-muted">No reviews available</p>}
                </div>
              ) : (
                <p className="text-muted italic">This worker has no reviews yet.</p>
              )}
            </div>
            
          </div>

          {user && user.role === 'customer' && (
            <div className="hire-section align-center" style={{ marginTop: '30px' }}>
              <button onClick={handleHire} className="btn-primary hire-btn giant-btn" style={{ background: '#10B981', borderColor: '#10B981', color: 'white' }}>
                Hire {workerUser.name.split(' ')[0]} Now
              </button>
            </div>
          )}

          {user && user.role === 'worker' && ((user.id || user._id) === (worker.user?._id || worker.user?.id)) && recommendedJobs.length > 0 && (
            <div className="recommended-jobs-section glass-subpanel full-width">
              <h2 className="section-heading recommended-title">Jobs You Might Be Interested In</h2>
              <div className="recommended-jobs list-gap">
                {Array.isArray(recommendedJobs) ? recommendedJobs.map(job => (
                  <motion.div 
                    key={job._id} 
                    className="job-card glass-panel"
                    whileHover={{ y: -3 }}
                  >
                    <div className="flex-between align-start">
                      <h3 className="job-title">{job.title}</h3>
                      <span className="job-budget font-bold text-green">₹{job.budget}</span>
                    </div>
                    
                    <p className="job-location text-muted" style={{ margin: '8px 0' }}><span className="icon">📍</span> {job.location}</p>
                    <p className="job-description text-body">{(job.description || '').substring(0, 100)}...</p>
                    
                    <div className="job-details flex-wrap-gap" style={{ margin: '16px 0' }}>
                      {(Array.isArray(job.requiredSkills) ? job.requiredSkills : []).map(skill => (
                         <span key={skill} className="skill-tag text-xs">{skill}</span>
                      ))}
                    </div>

                    <div className="job-actions border-top pt-16">
                      {applyingToJob === job._id ? (
                        <motion.div className="application-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <textarea
                            placeholder="Add a message to your application (optional)"
                            value={applicationMessage}
                            onChange={(e) => setApplicationMessage(e.target.value)}
                            rows="3"
                            className="full-width text-input"
                            style={{ marginBottom: '10px' }}
                          />
                          <div className="application-buttons flex-gap">
                            <button onClick={() => handleApplyForJob(job._id)} className="btn-primary">
                              Submit Application
                            </button>
                            <button onClick={() => setApplyingToJob(null)} className="btn-secondary">
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <button onClick={() => setApplyingToJob(job._id)} className="btn-primary w-full">
                          Apply for this Job
                        </button>
                      )}
                    </div>
                  </motion.div>
                )) : <p className="text-muted">No typical recommended jobs available</p>}
              </div>
            </div>
          )}

          {message && (
            <motion.div 
              className="message success glass-subpanel text-green border-green font-bold text-center mt-20"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {message}
            </motion.div>
          )}
        </div>
      </div>

      <DirectHireModal
        isOpen={hireModalOpen}
        onClose={() => setHireModalOpen(false)}
        worker={worker}
        onJobRequested={() => {
          setHireModalOpen(false);
          // Redirecting to dashboard or showing a success toast is handled by modal and app flow
          window.location.href = '/dashboard';
        }}
      />
    </motion.div>
  );
};

export default WorkerDetail;