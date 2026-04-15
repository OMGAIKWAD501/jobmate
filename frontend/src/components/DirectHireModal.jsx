import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_URL from '../config';
import toast from 'react-hot-toast';

const DirectHireModal = ({ isOpen, onClose, worker, onJobRequested }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    budget: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !worker) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        workerId: worker.user?._id || worker.user?.id,
        budget: Number(formData.budget)
      };
      
      await axios.post(`${API_URL}/api/jobs/direct-request`, payload);
      toast.success('Direct request sent successfully!');
      onJobRequested();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error sending request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}
        onClick={onClose}
      >
        <motion.div 
          className="glass-panel"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          style={{ width: '90%', maxWidth: '500px', padding: '30px', position: 'relative' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ marginBottom: '15px', color: '#10B981' }}>Hire {worker.user?.name} Directly</h2>
          <p className="text-muted" style={{ marginBottom: '20px' }}>
            Provide the details of your job request. It will be sent directly to this worker to accept.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label>Job Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required className="text-input" placeholder="e.g. Fix Kitchen Sink" />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required className="text-input" rows="3" placeholder="Describe what you need..." />
            </div>

            <div className="form-group">
              <label>General Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} required className="text-input" placeholder="e.g. Mumbai" />
            </div>

            <div className="form-group">
              <label>Budget (₹)</label>
              <input type="number" name="budget" value={formData.budget} onChange={handleChange} className="text-input" placeholder="e.g. 500" />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ background: '#10B981', borderColor: '#10B981' }}>
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DirectHireModal;
