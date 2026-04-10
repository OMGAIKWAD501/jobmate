import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
if (apiBaseUrl) {
  axios.defaults.baseURL = apiBaseUrl.replace(/\/+$/, '');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);