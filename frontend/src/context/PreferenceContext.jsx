import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const PreferenceContext = createContext();

export const usePreference = () => useContext(PreferenceContext);

export const PreferenceProvider = ({ children }) => {
  const { token } = useAuth();
  const [preference, setPreference] = useState({
    theme: localStorage.getItem('theme') || 'light',
    currency: 'USD',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    defaultView: 'overview'
  });
  const [loading, setLoading] = useState(true);

  // Load preferences from server when logged in
  useEffect(() => {
    const fetchPreferences = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/preferences');
          // Merge with local state, preferring server data but falling back to local
          const newPreference = {
            ...preference,
            ...response.data,
            // Always prioritize the stored theme
            theme: localStorage.getItem('theme') || response.data.theme || preference.theme
          };
          setPreference(newPreference);
        } catch (error) {
          console.error('Error fetching preferences:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [token]);

  // Update preferences
  const updatePreference = async (newValues) => {
    try {
      // Immediately update local state for responsive UI
      const updatedPreference = { ...preference, ...newValues };
      setPreference(updatedPreference);
      
      // Store theme preference in localStorage for persistence between sessions
      if (newValues.theme) {
        localStorage.setItem('theme', newValues.theme);
      }
      
      // If logged in, update server
      if (token) {
        await axios.put('/api/preferences', newValues);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  };

  return (
    <PreferenceContext.Provider value={{ preference, updatePreference, loading }}>
      {children}
    </PreferenceContext.Provider>
  );
};

export default PreferenceContext; 