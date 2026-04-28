import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const ReviewModal = ({ isOpen, onClose, job, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating.');
      return;
    }
    
    setLoading(true);
    try {
      // First complete the job if not already
      if (job.status !== 'completed') {
        await api.put(`/jobs/${job._id}/complete`);
      }
      
      // Then submit the review
      await api.post(`/jobs/${job._id}/review`, { rating, comment });
      
      toast.success(job.status === 'completed' ? 'Review submitted!' : 'Job completed and review submitted!');
      onReviewSubmitted(); // Refresh parent state
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error submitting review');
    } finally {
      setLoading(false);
    }
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
          <h2 style={{ marginBottom: '5px' }}>{job.status === 'completed' ? 'Leave a Review' : 'Complete & Review'}</h2>
          <p className="text-muted" style={{ marginBottom: '20px' }}>
            Rate your experience with this worker to help build the community.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  size={36}
                  fill={(hoverRating || rating) >= star ? '#FBBF24' : 'transparent'}
                  color={(hoverRating || rating) >= star ? '#FBBF24' : '#64748B'}
                  style={{ cursor: 'pointer', transition: 'all 0.1s ease' }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Leave a comment</label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How did the job go?"
                required
                rows="4"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewModal;
