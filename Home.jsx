import React from 'react';
import './Home.css';
import icon from './assets/icon.jpg';
import mainImage from './assets/main.jpg';
import laptop from './assets/laptop.jpg';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <div className="hero">
        <div className="hero-left">
          <img src={icon} alt="Icon" className="icon" />
          <p className="brand">Smart Tender Hub</p>
          <h1 className="main-heading">Revolutionizing the Tendering Process</h1>
          <p className="sub-heading">Join the Future of Bidding with Our Automated Platform</p>
          <button className="cta-button">Stay Updated!</button>
        </div>
        <div 
          className="hero-right"
          style={{ backgroundImage: `url(${laptop})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      </div>

      <div className="tagline">
        Transforming Tendering for the Modern Age
      </div>

      <div className="bottom-section">
        <img src={mainImage} alt="Meeting" className="bottom-image" />
        <div className="bottom-text">
          <h2 className="bottom-heading">Revolutionize Your Tendering Process Today!</h2>
          <div className="info-box">
            <p className="info-title">Get Started with Smart Tender Hub!</p>
            <p className="info-desc">Our platform allows you to streamline and optimize your bidding process.</p>
          </div>
          <button 
            className="join-btn"
            onClick={() => navigate('/login')}
          >
            Join Us Now!
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
