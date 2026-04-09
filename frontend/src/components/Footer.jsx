import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        
        {/* Logo & About */}
        <div className="footer-section">
          <h2 className="logo">JobMate</h2>
          <p>
            Connecting skilled workers with customers easily and efficiently.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <Link to="/workers">Find Workers</Link>
          <Link to="/jobs">Browse Jobs</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>

        {/* Support */}
        <div className="footer-section">
          <h3>Support</h3>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <a href="#">Help Center</a>
        </div>

        {/* Contact */}
        <div className="footer-section">
          <h3>Contact</h3>
          <p>Email: support@jobmate.com</p>
          <p>Phone: +91 98765 43210</p>
          <p>Location: India</p>
        </div>

      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} JobMate. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;