import React, { useState, useEffect } from 'react';
import { useTenders } from '../useTenders';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';
import * as api from '../api';
import './BidderDashboard.css';

const BidderDashboard = () => {
  const { tenders, placeBid, loading, error, refreshTenders } = useTenders();
  const { user, loading: authLoading } = useAuth();
  const [bidAmounts, setBidAmounts] = useState({});
  const [bidStatus, setBidStatus] = useState({});
  const [publishedTenders, setPublishedTenders] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Fetch all published tenders directly using the API
  useEffect(() => {
    const fetchPublishedTenders = async () => {
      if (!user || user.role !== 'Bidder') return;
      
      setFetchLoading(true);
      try {
        // Use the API function to get published tenders
        const allPublishedTenders = await api.fetchPublishedTenders();
        console.log("Published tenders:", allPublishedTenders);
        setPublishedTenders(allPublishedTenders);
      } catch (err) {
        console.error("Error fetching published tenders:", err);
        // Set empty array instead of breaking the UI
        setPublishedTenders([]);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchPublishedTenders();
  }, [user]);

  // Refresh all tenders for bid history
  useEffect(() => {
    refreshTenders();
  }, [refreshTenders]);

  // Check if user is actually a bidder
  if (!authLoading && (!user || user.role !== 'Bidder')) {
    return <Navigate to="/login" replace />;
  }

  const handleChange = (e, tenderId) => {
    const amount = e.target.value;
    // Only allow numbers and decimals
    if (amount === '' || /^\d*\.?\d{0,2}$/.test(amount)) {
      setBidAmounts({ ...bidAmounts, [tenderId]: amount });
      // Clear any previous status when user starts typing
      setBidStatus(prev => ({ ...prev, [tenderId]: null }));
    }
  };

  const handlePlaceBid = async (tenderId) => {
    const amount = parseFloat(bidAmounts[tenderId]);
    if (!amount || amount <= 0) {
      setBidStatus(prev => ({ 
        ...prev, 
        [tenderId]: { 
          type: 'error', 
          message: 'Please enter a valid bid amount' 
        } 
      }));
      return;
    }

    try {
      // Show loading status
      setBidStatus(prev => ({ 
        ...prev, 
        [tenderId]: { 
          type: 'loading', 
          message: 'Submitting your bid...' 
        } 
      }));

      // Call the API to place the bid
      await placeBid(tenderId, amount);
      
      // Clear the input and show success message
      setBidAmounts({ ...bidAmounts, [tenderId]: '' });
      setBidStatus(prev => ({ 
        ...prev, 
        [tenderId]: { 
          type: 'success', 
          message: 'Bid placed successfully!' 
        } 
      }));
      
      // Refresh tenders to show updated bids
      await refreshTenders();
      
      // Also refresh published tenders
      const updatedPublishedTenders = await api.fetchPublishedTenders();
      setPublishedTenders(updatedPublishedTenders);
    } catch (err) {
      console.error("Error placing bid:", err);
      setBidStatus(prev => ({ 
        ...prev, 
        [tenderId]: { 
          type: 'error',
          message: err.message || 'Failed to place bid. Please try again.' 
        } 
      }));
    }
  };

  // Format currency values
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading || authLoading || fetchLoading) {
    return (
      <div className="bidder-dashboard">
        <h1>Bidder Dashboard</h1>
        <p>Loading tenders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bidder-dashboard">
        <h1>Bidder Dashboard</h1>
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  // Get tenders the bidder has already bid on
  const myBiddedTenders = tenders.filter(tender => 
    tender.bids?.some(bid => bid.bidder_id === user.userId)
  );

  return (
    <div className="bidder-dashboard">
      <h1>Bidder Dashboard</h1>
      
      <section className="dashboard-section">
        <h2>Available Tenders</h2>
        {publishedTenders.length === 0 ? (
          <p>No published tenders available at the moment.</p>
        ) : (
          <div className="tenders-grid">
            {publishedTenders.map(tender => (
              <div key={tender.tender_id} className="tender-card">
                <div className="tender-header">
                  <h3>{tender.title}</h3>
                  <span className="tender-deadline">
                    Deadline: {new Date(tender.deadline).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="tender-description">
                  <p>{tender.description}</p>
                </div>
                
                <div className="bid-form">
                  <div className="input-group">
                    <label htmlFor={`bid-amount-${tender.tender_id}`}>Your Bid Amount:</label>
                    <input
                      id={`bid-amount-${tender.tender_id}`}
                      type="text"
                      value={bidAmounts[tender.tender_id] || ''}
                      onChange={(e) => handleChange(e, tender.tender_id)}
                      placeholder="Enter bid amount"
                      className="bid-input"
                    />
                  </div>
                  
                  <button 
                    onClick={() => handlePlaceBid(tender.tender_id)}
                    disabled={!bidAmounts[tender.tender_id] || bidStatus[tender.tender_id]?.type === 'loading'}
                    className="bid-button"
                  >
                    {bidStatus[tender.tender_id]?.type === 'loading' ? 'Submitting...' : 'Place Bid'}
                  </button>
                </div>
                
                {bidStatus[tender.tender_id] && (
                  <div className={`bid-status ${bidStatus[tender.tender_id].type}`}>
                    {bidStatus[tender.tender_id].message}
                  </div>
                )}
                
                {/* Show this bidder's previous bids on this tender */}
                {tender.bids?.filter(bid => bid.bidder_id === user.userId).length > 0 && (
                  <div className="my-bids-on-tender">
                    <h4>Your Previous Bids:</h4>
                    <ul className="my-bids-list">
                      {tender.bids
                        .filter(bid => bid.bidder_id === user.userId)
                        .map(bid => (
                          <li key={bid.bid_id} className="my-bid">
                            <span className="bid-amount">{formatCurrency(bid.amount)}</span>
                            <span className="bid-date">
                              Submitted: {new Date(bid.submission_date).toLocaleString()}
                            </span>
                            {bid.status === 'Locked' && (
                              <span className="bid-winner-badge">Winner!</span>
                            )}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      
      <section className="dashboard-section">
        <h2>My Bid History</h2>
        {myBiddedTenders.length === 0 ? (
          <p>You haven't placed any bids yet.</p>
        ) : (
          <div className="bid-history">
            {myBiddedTenders.map(tender => (
              <div key={tender.tender_id} className="history-item">
                <div className="history-header">
                  <h3>{tender.title}</h3>
                  <span className={`tender-status ${tender.status.toLowerCase()}`}>
                    {tender.status}
                  </span>
                </div>
                
                <div className="history-details">
                  <p><strong>Deadline:</strong> {new Date(tender.deadline).toLocaleDateString()}</p>
                  <p><strong>Description:</strong> {tender.description}</p>
                </div>
                
                <div className="history-bids">
                  <h4>Your Bids:</h4>
                  <ul className="history-bids-list">
                    {tender.bids
                      .filter(bid => bid.bidder_id === user.userId)
                      .map(bid => (
                        <li key={bid.bid_id} className="history-bid">
                          <div className="history-bid-info">
                            <span className="history-bid-amount">{formatCurrency(bid.amount)}</span>
                            <span className="history-bid-date">
                              Submitted: {new Date(bid.submission_date).toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Show evaluations for this bid - Fixed: 'eval' is a reserved word */}
                          {bid.evaluations && bid.evaluations.length > 0 && (
                            <div className="history-bid-evaluations">
                              <h5>Evaluations:</h5>
                              <ul className="evaluations-list">
                                {bid.evaluations.map(evaluation => (
                                  <li key={evaluation.evaluation_id} className="evaluation">
                                    <span className="evaluation-score">Score: {evaluation.score}/10</span>
                                    <span className="evaluation-date">
                                      {new Date(evaluation.evaluated_at).toLocaleDateString()}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Show winner badge if this bid is selected */}
                          {bid.status === 'Locked' && (
                            <div className="history-bid-winner">
                              <span className="winner-badge">Selected as Winner!</span>
                            </div>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default BidderDashboard;
