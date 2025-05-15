import React from 'react';
import { createRoot } from "react-dom/client";

import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { TenderProvider } from './TenderContext';

import App from './App';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <TenderProvider>
          <App />
        </TenderProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);