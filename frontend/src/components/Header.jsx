import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import NotificationsDropdown from './NotificationsDropdown';
import Button from './ui/Button';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <motion.header 
      className={`header ${scrolled ? 'header-scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <div className="container">
        <Link to="/" className="logo" onClick={() => setMobileOpen(false)}>
          <motion.h1 whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <span className="logo-icon">⚡</span>
            <span>JobMate</span>
          </motion.h1>
        </Link>

        <button type="button" className="mobile-menu-btn" onClick={() => setMobileOpen((prev) => !prev)}>
          {mobileOpen ? 'Close' : 'Menu'}
        </button>

        <nav className={`nav ${mobileOpen ? 'open' : ''}`}>
          <Link to="/workers" className={isActive('/workers') ? 'active' : ''} onClick={() => setMobileOpen(false)}>Find Workers</Link>
          <Link to="/jobs" className={isActive('/jobs') ? 'active' : ''} onClick={() => setMobileOpen(false)}>Jobs</Link>

          {user ? (
            <>
              <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''} onClick={() => setMobileOpen(false)}>Dashboard</Link>

              <div className="header-actions">
                <NotificationsDropdown />

                <div className="user-profile-btn">
                  <div className="avatar">{user.name.charAt(0)}</div>
                  <span className="user-info">{user.name}</span>
                </div>

                <Button variant="secondary" className="logout-btn" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-link auth-login" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/register" className="auth-link auth-register" onClick={() => setMobileOpen(false)}>Register</Link>
            </div>
          )}
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;