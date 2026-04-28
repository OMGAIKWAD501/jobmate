import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';
import API_URL from './config';

const apiBaseUrl = API_URL.replace(/\/+$, '');
console.log('API:', apiBaseUrl);
axios.defaults.baseURL = apiBaseUrl;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);