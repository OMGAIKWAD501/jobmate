import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
    location: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await register(formData);
    
    if (result.success) {
      // Save credentials for prefill on next login/register visit.
      localStorage.setItem('rememberedEmail', formData.email);
      localStorage.setItem('rememberedPassword', formData.password);
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container glass-panel">
        <h1 className="text-center section-heading">Join JobMate</h1>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px'}}>{error}</div>}
          
          <div className="form-group mb-15">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              className="text-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group mb-15">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="text-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group mb-15">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="text-input"
                style={{ paddingRight: '45px', margin: 0, width: '100%' }}
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide Password" : "Show Password"}
                style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>
          
          <div className="form-group mb-15">
            <label htmlFor="role">I am a:</label>
            <select
              id="role"
              name="role"
              className="text-input"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="customer">Customer (looking to hire)</option>
              <option value="worker">Worker (offering services)</option>
            </select>
          </div>
          
          <div className="form-group mb-15">
            <label htmlFor="phone">Phone (optional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="text-input"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group mb-20">
            <label htmlFor="location">Location (optional)</label>
            <input
              type="text"
              id="location"
              name="location"
              className="text-input"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, State"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary auth-submit w-full giant-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="auth-links text-center mt-20">
          <p className="text-muted">Already have an account? <Link to="/login" className="text-active font-bold">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;