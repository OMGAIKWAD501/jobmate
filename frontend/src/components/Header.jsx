import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.header 
      className={`header ${scrolled ? 'header-scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <div className="container">
        <Link to="/" className="logo">
          <motion.h1 whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <span className="logo-icon">⚡</span> JobMate
          </motion.h1>
        </Link>
        
        <nav className="nav">
          <Link to="/workers" className={location.pathname === '/workers' ? 'active' : ''}>Find Workers</Link>
          <Link to="/jobs" className={location.pathname === '/jobs' ? 'active' : ''}>Jobs</Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
              <div className="user-profile-btn">
                <div className="avatar">{user.name.charAt(0)}</div>
                <span className="user-info">{user.name}</span>
              </div>
              <button onClick={handleLogout} className="btn-secondary logout-btn">
                Logout
              </button>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/register" className="btn-primary">Register</Link>
            </div>
          )}
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;