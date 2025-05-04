import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import axios from 'axios';
import { PreferenceProvider } from './context/PreferenceContext';
import { AuthProvider } from './context/AuthContext';

// Set base URL for axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://final-project-1-22hm.onrender.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <PreferenceProvider>
        <App />
      </PreferenceProvider>
    </AuthProvider>
  </React.StrictMode>
); 