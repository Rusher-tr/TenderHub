import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import LogIn from './LogIn';
import NavBar from './NavBar';
import './App.css';
import AdminDashboard from './dashboards/AdminDashboard';
import BidderDashboard from './dashboards/BidderDashboard';
import BuyerDashboard from './dashboards/BuyerDashboard';
import EvaluatorDashboard from './dashboards/EvaluatorDashboard';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <NavBar />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LogIn />} />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bidder-dashboard"
              element={
                <ProtectedRoute allowedRoles={['Bidder']}>
                  <BidderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyer-dashboard"
              element={
                <ProtectedRoute allowedRoles={['Buyer']}>
                  <BuyerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evaluator-dashboard"
              element={
                <ProtectedRoute allowedRoles={['Evaluator']}>
                  <EvaluatorDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
