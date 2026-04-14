import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-section">
          <h2 className="logo">JobMate</h2>
          <p>
            A modern hiring network that connects reliable local workers with customers in minutes.
          </p>
          <span className="footer-badge">Built for trust and speed</span>
        </div>

        <div className="footer-section">
          <h3>Explore</h3>
          <Link to="/workers">Find Workers</Link>
          <Link to="/jobs">Browse Jobs</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>

        <div className="footer-section">
          <h3>Support</h3>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <a href="mailto:support@jobmate.com">Help Center</a>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>
          <p>Email: support@jobmate.com</p>
          <p>Phone: +91 98765 43210</p>
          <p>Location: India</p>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} JobMate. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;