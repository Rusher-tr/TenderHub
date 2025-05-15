import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './LogIn.css';

const LogIn = () => {
  const { login, user, loading } = useAuth();
  const [role, setRole] = useState('Bidder');
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [organizationAddress, setOrganizationAddress] = useState('');
  const navigate = useNavigate();

  // Set default role on component mount
  useEffect(() => {
    setRole('Bidder');
  }, []);

  const handleRoleClick = (selectedRole) => {
    setRole(selectedRole);
  };
  const toggleMode = () => {
    setIsSignup(!isSignup);
    // Set default role instead of clearing it
    setRole('Bidder');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignup && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }    const payload = {
      email,
      password,
      role,
      ...(isSignup && {
        name,
        contactNumber,
        ...(role === 'Buyer' && { organizationAddress })
      })
    };
    console.log('Payload:', payload);

    const endpoint = isSignup ? 'signup' : 'login';    try {
      // Use the api.js module instead of direct fetch calls
      const data = await (isSignup ? api.signup(payload) : api.login(payload));if (!res.ok) {
        const errorText = await res.text();
        console.error('Error:', errorText);
        
        // Try to parse the error as JSON
        try {
          const errorJson = JSON.parse(errorText);
          alert(errorJson.error || 'Something went wrong');
        } catch {
          // If not JSON, just show the text
          alert(errorText || 'Something went wrong');
        }
        return;
      }

      const data = await res.json();
      
      // Get role from response data or use the selected role
      const userRole = data.role || role;

      // Use the auth context to login
      login(data.token, userRole);

      // Redirect based on role
      if (role === 'Admin') navigate('/admin-dashboard');
      else if (role === 'Bidder') navigate('/bidder-dashboard');
      else if (role === 'Buyer') navigate('/buyer-dashboard');
      else if (role === 'Evaluator') navigate('/evaluator-dashboard');

    } catch (err) {
      console.error('Network Error:', err);
      alert('Failed to connect to server');
    }
  };

  // If user is already logged in, redirect to appropriate dashboard
  if (!loading && user) {
    switch(user.role) {
      case 'Admin': return <Navigate to="/admin-dashboard" replace />;
      case 'Buyer': return <Navigate to="/buyer-dashboard" replace />;
      case 'Bidder': return <Navigate to="/bidder-dashboard" replace />;
      case 'Evaluator': return <Navigate to="/evaluator-dashboard" replace />;
      default: return <Navigate to="/" replace />;
    }
  }

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="loading-auth">Authenticating...</div>
    );
  }

  const renderForm = () => {
    if (!role) return null;

    return (
      <form onSubmit={handleSubmit}>
        <h2>{role} {isSignup ? 'Sign Up' : 'Login'}</h2>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {isSignup && (
          <>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <input
                type="text"
                placeholder="Enter contact number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
              />
            </div>

            {role === 'Buyer' && (
              <div className="form-group">
                <label>Organization Address</label>
                <input
                  type="text"
                  placeholder="Enter organization address"
                  value={organizationAddress}
                  onChange={(e) => setOrganizationAddress(e.target.value)}
                  required
                />
              </div>
            )}
          </>
        )}

        <button type="submit" className="submit-button">
          {isSignup ? 'Sign Up' : `Login as ${role}`}
        </button>
      </form>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="heading-wrapper">
        <h1 className="heading">Welcome to Smart Tender Hub</h1>
      </div>
      <div className="main-wrapper">
        <div className="container">
          <div className="toggle-wrapper">
            {['Admin', 'Bidder', 'Buyer', 'Evaluator'].map((r) => (
              <button
                key={r}
                className={`toggle-button ${role === r ? 'active' : ''}`}
                onClick={() => handleRoleClick(r)}
              >
                {r}
              </button>
            ))}
          </div>
          {renderForm()}
          <p className="switch-text">
            {isSignup ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
            <button className="switch-button" onClick={toggleMode}>
              {isSignup ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogIn;
