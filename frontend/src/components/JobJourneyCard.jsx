import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import API_URL from '../config';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ReviewModal from './ReviewModal';
import './JobJourneyCard.css';

const JobJourneyCard = ({ job, onUpdate, onOpenReview }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const isCustomer = user?.role === 'customer';
  const isWorker = user?.role === 'worker';
  
  if (!job) return null;



  const handleAPI = async (method, url, payload = {}) => {
    setLoading(true);
    try {
      await axios[method](url, payload);
      toast.success('Success');
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => handleAPI('put', `${API_URL}/api/jobs/${job._id}/direct-accept`);
  
  const handleShareLocation = () => {
    setLoading(true);
    
    // Bypass Geolocation API for local dev testing to prevent browser hanging errors
    const lat = 19.0760;
    const lng = 72.8777;
    
    handleAPI('put', `${API_URL}/api/jobs/${job._id}/share-location`, { lat, lng });
  };

  const handleStartJob = () => handleAPI('put', `${API_URL}/api/jobs/${job._id}/start`);
  
  const handleMarkCompleted = () => handleAPI('put', `${API_URL}/api/jobs/${job._id}/complete`);

  const steps = [
    { id: 'pending', label: 'Requested', color: '#FCD34D' },
    { id: 'accepted', label: 'Accepted', color: '#93C5FD' },
    { id: 'in-progress', label: 'In Progress', color: '#6EE7B7' },
    { id: 'completed', label: 'Completed', color: '#C4B5FD' }
  ];

  const status = job.status || 'open';
  const effectiveStatus = status === 'assigned' ? 'accepted' : status;
  const currentStepIndex = steps.findIndex(s => s.id === effectiveStatus) >= 0 ? steps.findIndex(s => s.id === effectiveStatus) : 0;

  return (
    <motion.div className={`job-journey-card glass-subpanel ${status}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="journey-header">
        <div>
          <h3 className="m-0 text-active mb-10">{job.title}</h3>
          <p className="text-muted text-sm m-0">
            {isCustomer ? `Worker: ${job.assignedWorker?.name || 'Assigned Worker'}` : `Customer: ${job.customer?.name || 'Customer'}`}
          </p>
        </div>
        <span className={`journey-status-badge ${status}`}>{status.replace('-', ' ')}</span>
      </div>

      <p className="text-body my-10">{job.description}</p>
      
      {job.budget && <p className="font-bold text-green mt-10">Budget: ₹{job.budget}</p>}

      <div className="step-indicator">
        {steps.map((step, idx) => (
          <div key={step.id} className={`step ${idx <= currentStepIndex ? 'active' : ''}`} style={{ color: step.color }}>
            <div className="step-dot"></div>
            <span className="step-label">{step.label}</span>
          </div>
        ))}
      </div>

      <div className="journey-actions">
        {status === 'pending' && isCustomer && (
          <button 
            onClick={() => handleAPI('delete', `${API_URL}/api/jobs/${job._id}`)} 
            disabled={loading} 
            className="btn-secondary" 
            style={{ color: '#EF4444', borderColor: '#EF4444' }}
          >
            Cancel Request
          </button>
        )}

        {status === 'pending' && isWorker && (
          <button onClick={handleAccept} disabled={loading} className="btn-primary" style={{ background: '#3B82F6', borderColor: '#3B82F6' }}>Accept Job</button>
        )}

        {(status === 'accepted' || status === 'assigned') && isCustomer && (!job.geometry?.coordinates || job.geometry.coordinates.length < 2) && (
          <button onClick={handleShareLocation} disabled={loading} className="btn-secondary" style={{ color: '#F59E0B', borderColor: '#F59E0B' }}>
            Share Location to Continue
          </button>
        )}

        {(status === 'accepted' || status === 'assigned') && isWorker && (job.geometry?.coordinates && job.geometry.coordinates.length >= 2) && (
          <button onClick={handleStartJob} disabled={loading} className="btn-primary" style={{ background: '#10B981', borderColor: '#10B981' }}>Start Job</button>
        )}

        {(status === 'in-progress' || status === 'accepted' || status === 'assigned') && isCustomer && (
          <button onClick={handleMarkCompleted} disabled={loading} className="btn-secondary" style={{ color: '#8B5CF6', borderColor: '#8B5CF6' }}>Mark as Completed</button>
        )}

        {status === 'completed' && isCustomer && !job.isReviewed && (
          <button onClick={onOpenReview} className="btn-primary" style={{ background: '#8B5CF6', borderColor: '#8B5CF6' }}>Submit Review</button>
        )}
      </div>

    </motion.div>
  );
};

export default JobJourneyCard;
