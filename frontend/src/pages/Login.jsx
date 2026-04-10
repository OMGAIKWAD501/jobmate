import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // On initial mount, load auto-saved credentials if present
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail || savedPassword) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail || '',
        password: savedPassword || ''
      }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setRememberMe(checked);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Save login credentials only when user explicitly opts in.
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
        localStorage.setItem('rememberedPassword', formData.password);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container glass-panel">
        <h1 className="text-center section-heading">Login to JobMate</h1>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px'}}>{error}</div>}
          
          <div className="form-group mb-15">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="text-input"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
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
                autoComplete="current-password"
                required
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

          <div className="form-group mb-20" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}>
            <input 
              type="checkbox" 
              id="rememberMe" 
              name="rememberMe" 
              checked={rememberMe} 
              onChange={handleChange} 
              style={{ width: 'auto', margin: 0, cursor: 'pointer', flexShrink: 0 }}
            />
            <label htmlFor="rememberMe" style={{ margin: 0, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-body)', display: 'inline', whiteSpace: 'nowrap' }}>
              Remember my email securely
            </label>
          </div>
          
          <button 
            type="submit" 
            className="btn-primary auth-submit w-full giant-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login Securely'}
          </button>
        </form>
        
        <div className="auth-links text-center mt-20">
          <p className="text-muted">Don't have an account? <Link to="/register" className="text-active font-bold">Register here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;