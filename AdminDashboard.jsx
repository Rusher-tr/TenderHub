import React, { useState, useEffect, useCallback } from 'react';
import { useTenders } from '../useTenders';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';
import * as api from '../api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { tenders, updateTenderStatus, loading, error, setTenders, selectWinner } = useTenders();
  const { user, loading: authLoading } = useAuth();
  const [statusMessages, setStatusMessages] = useState({});
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);
  
  // Winner-related states
  const [winners, setWinners] = useState([]);
  const [winnerLoading, setWinnerLoading] = useState(false);
  const [expandedTender, setExpandedTender] = useState(null);
  const [selectedBids, setSelectedBids] = useState({});
  
  // Fetch all tenders for admin when component mounts
  useEffect(() => {
    const fetchAdminTenders = async () => {
      setAdminLoading(true);
      try {
        const allTenders = await api.fetchAllTenders();
        setTenders(allTenders);
        setAdminError(null);
      } catch (err) {
        console.error("Error fetching admin tenders:", err);
        setAdminError(err.message);
      } finally {
        setAdminLoading(false);
      }
    };

    fetchAdminTenders();
  }, [setTenders, user]);
    // Fetch winners - simplified to avoid errors
  useEffect(() => {
    const fetchWinners = async () => {
      if (!user || user.role !== 'Admin') return;
      
      setWinnerLoading(true);
      try {
        // Added error handling for backend connection issues
        const isBackendAvailable = await api.checkBackendConnection().catch(() => false);
        if (!isBackendAvailable) {
          console.warn("Backend server is unavailable - winners will be empty");
          setWinners([]);
          return;
        }
        
        const winnerData = await api.fetchAllWinners();
        setWinners(winnerData || []);
      } catch (err) {
        console.warn("Winners feature unavailable:", err);
        setWinners([]);
      } finally {
        setWinnerLoading(false);
      }
    };

    fetchWinners();
  }, [user]);
  
  // Toggle showing bid details for a tender
  const toggleBidDetails = useCallback((tenderId) => {
    setExpandedTender(prevExpanded => 
      prevExpanded === tenderId ? null : tenderId
    );
  }, []);
  
  // Handle selecting a bid
  const handleBidSelection = useCallback((tenderId, bidId) => {
    setSelectedBids(prev => ({
      ...prev,
      [tenderId]: bidId
    }));
  }, []);
  
  // Handle selecting a winner
  const handleSelectWinner = useCallback(async (tenderId) => {
    const bidId = selectedBids[tenderId];
    if (!bidId) {
      setStatusMessages(prev => ({
        ...prev,
        [tenderId]: { type: 'error', message: 'Please select a bid first' }
      }));
      return;
    }
    
    try {
      setWinnerLoading(true);
      await selectWinner(tenderId, bidId);
      
      // Fetch updated winners
      const winnerData = await api.fetchAllWinners();
      setWinners(winnerData);
      
      setStatusMessages(prev => ({
        ...prev,
        [tenderId]: { type: 'success', message: 'Winner selected successfully' }
      }));
      
      // Close the expanded view
      setExpandedTender(null);
      
      // Clear the selection
      setSelectedBids(prev => {
        const newSelection = {...prev};
        delete newSelection[tenderId];
        return newSelection;
      });
    } catch (err) {
      console.error("Error selecting winner:", err);
      setStatusMessages(prev => ({
        ...prev,
        [tenderId]: { type: 'error', message: err.message }
      }));
    } finally {
      setWinnerLoading(false);
    }
  }, [selectWinner, selectedBids]);
  
  // Check if user is actually an admin
  if (!authLoading && (!user || user.role !== 'Admin')) {
    return <Navigate to="/login" replace />;
  }
  
  const handleStatusChange = async (tenderId, status) => {
    try {
      // Show loading state for this specific tender
      setStatusMessages(prev => ({
        ...prev,
        [tenderId]: { type: 'loading', message: `Updating status to ${status}...` }
      }));
      
      // Call the context function to update status
      const result = await updateTenderStatus(tenderId, status);
      
      // Optimistically update the UI regardless of backend success
      // This allows the app to work during development
      
      // Show success message for this specific tender
      setStatusMessages(prev => ({
        ...prev,
        [tenderId]: { 
          type: 'success', 
          message: `Tender status updated to ${status}` + 
                   (result.success ? '' : ' (UI only, backend error occurred)')
        }
      }));
      
      // Give UI time to update before trying to refresh data
      setTimeout(async () => {
        try {
          // Try to refresh but don't fail if it doesn't work
          const updatedTenders = await api.fetchAllTenders().catch(() => null);
          if (updatedTenders) setTenders(updatedTenders);
        } catch (e) {
          // Silently ignore refresh errors
          console.warn("Could not refresh tenders:", e);
        }
      }, 500);
      
    } catch (err) {
      console.error("Status change error:", err);
      // Show error but the UI should still update due to the optimistic updates
      setStatusMessages(prev => ({
        ...prev,
        [tenderId]: { 
          type: 'warning', // Use warning instead of error since the UI updated
          message: `UI updated but server reported: ${err.message}`
        }
      }));
    }
  };
  
  if (loading || adminLoading || authLoading) {
    return (
      <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>
        <p>Loading tenders...</p>
      </div>
    );
  }

  if (error || adminError) {
    return (
      <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>
        <p className="error-message">Error: {error || adminError}</p>
      </div>
    );
  }
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="admin-dashboard-info">
        <p><strong>Tender Status Guide:</strong></p>
        <ul className="status-guide">
          <li><span className="status-badge pending">Pending Approval</span> - Needs admin review</li>
          <li><span className="status-badge published">Published</span> - Active and visible to bidders</li>
          <li><span className="status-badge rejected">Rejected</span> - Declined by admin</li>
          <li><span className="status-badge archived">Archived</span> - Past deadline or canceled</li>
        </ul>
      </div>
      
      {tenders.length === 0 ? (
        <p>No tenders created yet.</p>
      ) : (
        <>
          <h2>Pending Approval</h2>
          {tenders.filter(tender => tender.status === 'Pending Approval').length === 0 ? (
            <p>No tenders pending approval.</p>
          ) : (
            <ul className="tender-list">
              {tenders
                .filter(tender => tender.status === 'Pending Approval')
                .map((tender) => (
                  <li key={tender.tender_id} className="tender-item">
                    <div className="tender-info">
                      <h3>{tender.title}</h3>
                      <p><strong>Buyer:</strong> {tender.buyer_name}</p>
                      <p><strong>Created On:</strong> {new Date(tender.issue_date).toLocaleDateString()}</p>
                      <p><strong>Deadline:</strong> {new Date(tender.deadline).toLocaleDateString()}</p>
                      <p><strong>Description:</strong> {tender.description}</p>
                    </div>
                    <div className="tender-status">
                      <p><strong>Status:</strong> <span className="status-badge pending">{tender.status}</span></p>
                      {statusMessages[tender.tender_id] && (
                        <p className={`status-message ${statusMessages[tender.tender_id].type}`}>
                          {statusMessages[tender.tender_id].message}
                        </p>
                      )}
                      <div className="action-buttons">
                        <button
                          onClick={() => handleStatusChange(tender.tender_id, 'Published')}
                          className="approve-button"
                          disabled={loading}
                        >
                          {loading ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleStatusChange(tender.tender_id, 'Rejected')}
                          className="reject-button"
                          disabled={loading}
                        >
                          {loading ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}          <h2>Published Tenders</h2>
          {tenders.filter(tender => tender.status === 'Published').length === 0 ? (
            <p>No published tenders.</p>
          ) : (
            <ul className="tender-list published-tenders">
              {tenders
                .filter(tender => tender.status === 'Published')
                .map((tender) => (
                  <li key={tender.tender_id} className="tender-item">
                    <div className="tender-info">
                      <h3>{tender.title}</h3>
                      <p><strong>Buyer:</strong> {tender.buyer_name}</p>
                      <p><strong>Created On:</strong> {new Date(tender.issue_date).toLocaleDateString()}</p>
                      <p><strong>Deadline:</strong> {new Date(tender.deadline).toLocaleDateString()}</p>
                      <p><strong>Description:</strong> {tender.description}</p>
                    </div>
                    <div className="tender-status">
                      <p><strong>Status:</strong> <span className="status-badge published">{tender.status}</span></p>
                      {statusMessages[tender.tender_id] && (
                        <p className={`status-message ${statusMessages[tender.tender_id].type}`}>
                          {statusMessages[tender.tender_id].message}
                        </p>
                      )}                      <div className="action-buttons">
                        <button
                          onClick={() => handleStatusChange(tender.tender_id, 'Archived')}
                          className="archive-button"
                          disabled={loading}
                        >
                          {loading ? 'Archiving...' : 'Archive'}
                        </button>
                        <button
                          onClick={() => toggleBidDetails(tender.tender_id)}
                          className="toggle-bid-details-button"
                        >
                          {expandedTender === tender.tender_id ? 'Hide Bids' : 'View Bids'}
                        </button>
                      </div>
                    </div>
                    
                    {expandedTender === tender.tender_id && (
                      <div className="bid-details">
                        <h3>Bids Received</h3>
                        {tender.bids && tender.bids.length > 0 ? (
                          <>
                            <div className="bids-list">
                              {tender.bids.map(bid => (
                                <div 
                                  key={bid.bid_id} 
                                  className={`bid-item ${selectedBids[tender.tender_id] === bid.bid_id ? 'selected' : ''}`}
                                >
                                  <div className="bid-info">
                                    <p><strong>Bidder:</strong> {bid.bidder_name}</p>
                                    <p><strong>Amount:</strong> ${bid.amount}</p>
                                    <p><strong>Date:</strong> {new Date(bid.bid_date).toLocaleDateString()}</p>
                                    {bid.score && <p><strong>Evaluation Score:</strong> {bid.score}/10</p>}
                                  </div>
                                  <button
                                    onClick={() => handleBidSelection(tender.tender_id, bid.bid_id)}
                                    className={`select-bid-button ${selectedBids[tender.tender_id] === bid.bid_id ? 'selected' : ''}`}
                                  >
                                    {selectedBids[tender.tender_id] === bid.bid_id ? 'Selected' : 'Select'}
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => handleSelectWinner(tender.tender_id)}
                              className="select-winner-button"
                              disabled={winnerLoading || !selectedBids[tender.tender_id]}
                            >
                              {winnerLoading ? 'Processing...' : 'Select as Winner'}
                            </button>
                          </>
                        ) : (
                          <p>No bids received for this tender.</p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          )}
          
          <h2>Rejected Tenders</h2>
          {tenders.filter(tender => tender.status === 'Rejected').length === 0 ? (
            <p>No rejected tenders.</p>
          ) : (
            <ul className="tender-list rejected-tenders">
              {tenders
                .filter(tender => tender.status === 'Rejected')
                .map((tender) => (
                  <li key={tender.tender_id} className="tender-item">
                    <div className="tender-info">
                      <h3>{tender.title}</h3>
                      <p><strong>Buyer:</strong> {tender.buyer_name}</p>
                      <p><strong>Created On:</strong> {new Date(tender.issue_date).toLocaleDateString()}</p>
                      <p><strong>Deadline:</strong> {new Date(tender.deadline).toLocaleDateString()}</p>
                      <p><strong>Description:</strong> {tender.description}</p>
                    </div>
                    <div className="tender-status">
                      <p><strong>Status:</strong> <span className="status-badge rejected">{tender.status}</span></p>
                      {statusMessages[tender.tender_id] && (
                        <p className={`status-message ${statusMessages[tender.tender_id].type}`}>
                          {statusMessages[tender.tender_id].message}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          )}
          
          <h2>Archived Tenders</h2>
          {tenders.filter(tender => tender.status === 'Archived').length === 0 ? (
            <p>No archived tenders.</p>
          ) : (
            <ul className="tender-list archived-tenders">
              {tenders
                .filter(tender => tender.status === 'Archived')
                .map((tender) => (
                  <li key={tender.tender_id} className="tender-item">
                    <div className="tender-info">
                      <h3>{tender.title}</h3>
                      <p><strong>Buyer:</strong> {tender.buyer_name}</p>
                      <p><strong>Created On:</strong> {new Date(tender.issue_date).toLocaleDateString()}</p>
                      <p><strong>Deadline:</strong> {new Date(tender.deadline).toLocaleDateString()}</p>
                      <p><strong>Description:</strong> {tender.description}</p>
                    </div>
                    <div className="tender-status">
                      <p><strong>Status:</strong> <span className="status-badge archived">{tender.status}</span></p>
                    </div>
                  </li>
                ))}            </ul>
          )}
          
          <h2>Winners</h2>
          {winnerLoading ? (
            <p>Loading winners...</p>
          ) : winners.length === 0 ? (
            <p>No winners selected yet.</p>
          ) : (
            <ul className="winner-list">
              {winners.map(winner => (
                <li key={winner.tender_id} className="winner-item">
                  <div className="winner-info">
                    <h3>{winner.tender_title}</h3>
                    <p><strong>Winner:</strong> {winner.bidder_name}</p>
                    <p><strong>Winning Bid:</strong> ${winner.bid_amount}</p>
                    <p><strong>Score:</strong> {winner.avg_score ? `${winner.avg_score}/10` : 'Not scored'}</p>
                    <p><strong>Selected On:</strong> {new Date(winner.selected_date).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
