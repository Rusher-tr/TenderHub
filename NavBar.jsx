import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NavBar.css';
import { useAuth } from './AuthContext';

const NavBar = () => {
  // Wrap the useAuth hook in a try-catch to prevent crashes
  // during development hot reloads or if it's used outside the provider
  let user = null;
  let logout = () => {};
  let loading = false;
  
  try {
    const authContext = useAuth();
    user = authContext.user;
    logout = authContext.logout;
    loading = authContext.loading;
  } catch (error) {
    console.warn("Auth context not available:", error.message);
  }
  
  const navigate = useNavigate();

  const handleLogout = () => {
    if (typeof logout === 'function') {
      logout();
      navigate('/');
    }
  };

  // Show a simpler navbar during auth loading
  if (loading) {
    return (
      <div className="navbar">
        <div className="navbar-left">
          <Link to="/">Smart Tender Hub</Link>
        </div>
        <div className="navbar-right">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="navbar">
      <div className="navbar-left">
        <Link to="/">Smart Tender Hub</Link>
      </div>
      <div className="navbar-right">
        {user ? (
          <>
            <Link to={`/${user.role.toLowerCase()}-dashboard`}>Dashboard</Link>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </div>
  );
};

export default NavBar;