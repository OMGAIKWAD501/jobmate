import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './WorkerCard.css';

const WorkerCard = ({ worker, index = 0 }) => {
  const safeWorker = worker || {};
  const user = safeWorker.user || {};
  const rating = Number(safeWorker.rating) || 0;
  const hourlyRate = safeWorker.hourlyRate;
  const completedJobs = safeWorker.completedJobs || 0;
  const skills = Array.isArray(safeWorker.skills) ? safeWorker.skills : [];

  return (
    <motion.div
      className="worker-card glass-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -5 }}
    >
      <div className="worker-header">
        <div className="worker-avatar-container">
          <img
            src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Worker')}&background=random`}
            alt={user?.name || 'Worker'}
            className="worker-avatar"
          />
          {rating >= 4.8 && <div className="top-rated-badge">🔥 Top</div>}
        </div>
        <div className="worker-info">
          <h3>{user?.name || 'Worker'}</h3>
          <p className="location">
            <span className="icon">📍</span> {user?.location || 'Location unavailable'}
          </p>
        </div>
      </div>

      <div className="worker-details">
        <div className="skills">
          {Array.isArray(skills) && skills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="skill-tag">{skill}</span>
          ))}
          {Array.isArray(skills) && skills.length > 3 && <span className="skill-more">+{skills.length - 3}</span>}
        </div>

        <div className="stats-divider"></div>

        <div className="stats">
          <div className="stat">
            <span className="stat-value rating">⭐ {rating.toFixed(1)}</span>
            <span className="stat-label">Rating</span>
          </div>
          <div className="stat">
            <span className="stat-value jobs">{completedJobs}</span>
            <span className="stat-label">Jobs</span>
          </div>
          {hourlyRate && (
            <div className="stat">
              <span className="stat-value rate">₹{hourlyRate}</span>
              <span className="stat-label">per hr</span>
            </div>
          )}
        </div>
      </div>

      {user?._id ? (
        <Link to={`/workers/${user._id}`} className="btn-primary view-profile">
          View Profile
        </Link>
      ) : (
        <span className="btn-primary view-profile" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          Profile Unavailable
        </span>
      )}
    </motion.div>
  );
};

export default WorkerCard;