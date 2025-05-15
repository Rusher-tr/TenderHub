import React, { useState, useEffect } from 'react';
import { useTenders } from '../useTenders';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';
import './EvaluatorDashboard.css';

const EvaluatorDashboard = () => {
  const { tenders, scoreBid, loading, error, refreshTenders } = useTenders();
  const { user, loading: authLoading } = useAuth();
  const [scores, setScores] = useState({});
  const [scoreStatus, setScoreStatus] = useState({});

  // Refresh tenders when component mounts
  useEffect(() => {
    refreshTenders();
  }, [refreshTenders]);

  // Check if user is actually an evaluator
  if (!authLoading && (!user || user.role !== 'Evaluator')) {
    return <Navigate to="/login" replace />;
  }

  const handleScoreChange = (bidId, value) => {
    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 10)) {
      setScores(prev => ({
        ...prev,
        [bidId]: value
      }));
      // Clear any previous status when user starts typing
      setScoreStatus(prev => ({ ...prev, [bidId]: null }));
    }
  };

  const handleSubmitScore = async (bidId) => {
    const score = parseFloat(scores[bidId]);
    
    if (isNaN(score) || score < 0 || score > 10) {
      setScoreStatus(prev => ({
        ...prev,
        [bidId]: {
          type: 'error',
          message: 'Please enter a valid score between 0 and 10'
        }
      }));
      return;
    }

    try {
      await scoreBid(bidId, score);
      setScores(prev => ({ ...prev, [bidId]: '' }));
      setScoreStatus(prev => ({
        ...prev,
        [bidId]: {
          type: 'success',
          message: 'Score submitted successfully!'
        }
      }));
      // Refresh tenders to show updated evaluations
      refreshTenders();
    } catch (err) {
      setScoreStatus(prev => ({
        ...prev,
        [bidId]: {
          type: 'error',
          message: err.message
        }
      }));
    }
  };

  if (loading || authLoading) {
    return (
      <div className="evaluator-dashboard">
        <h1>Evaluator Dashboard</h1>
        <p>Loading tenders and bids...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="evaluator-dashboard">
        <h1>Evaluator Dashboard</h1>
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  // Filter to get only published tenders with bids
  const publishedTendersWithBids = tenders.filter(
    tender => tender.status === 'Published' && tender.bids && tender.bids.length > 0
  );

  return (
    <div className="evaluator-dashboard">
      <h1>Evaluator Dashboard</h1>
      
      <div className="dashboard-info">
        <p>As an evaluator, you can review and score bids on published tenders. Your evaluations help determine the best bidder for each tender.</p>
      </div>
      
      <div className="dashboard-container">
        {/* LEFT SECTION: Unscored Bids */}
        <div className="unscored-section">
          <h2>Unscored Bids</h2>
          
          {publishedTendersWithBids.length === 0 ? (
            <p className="no-items">No tenders with bids available for evaluation.</p>
          ) : (
            publishedTendersWithBids.map((tender) => {
              // Get bids that haven't been scored by this evaluator
              const unscoredBids = tender.bids.filter(bid => 
                !bid.evaluations || !bid.evaluations.some(e => e.evaluator_id === user.userId)
              );
              
              if (unscoredBids.length === 0) return null;
              
              return (
                <div key={tender.tender_id} className="tender-card">
                  <div className="tender-header">
                    <h3>{tender.title}</h3>
                    <span className="deadline">Deadline: {new Date(tender.deadline).toLocaleDateString()}</span>
                  </div>
                  
                  <p className="tender-description">{tender.description}</p>
                  
                  <div className="bids-container">
                    <h4>Bids Awaiting Your Evaluation:</h4>
                    
                    {unscoredBids.map((bid) => (
                      <div key={bid.bid_id} className="bid-row">
                        <div className="bid-info">
                          <span className="bid-amount">💰 ${parseFloat(bid.amount).toFixed(2)}</span>
                          <span className="bid-date">Submitted: {new Date(bid.submission_date).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="bid-scoring">
                          <div className="score-input-group">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              placeholder="Score (0-10)"
                              value={scores[bid.bid_id] || ''}
                              onChange={(e) => handleScoreChange(bid.bid_id, e.target.value)}
                              className="score-input"
                            />
                            <button 
                              onClick={() => handleSubmitScore(bid.bid_id)}
                              className="score-submit-button"
                              disabled={loading}
                            >
                              {loading ? 'Submitting...' : 'Submit Score'}
                            </button>
                          </div>
                          
                          {scoreStatus[bid.bid_id] && (
                            <p className={`score-status ${scoreStatus[bid.bid_id].type}`}>
                              {scoreStatus[bid.bid_id].message}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }).filter(Boolean)
          )}
        </div>
        
        {/* RIGHT SECTION: Scored Bids */}
        <div className="scored-section">
          <h2>Your Evaluations</h2>
          
          {publishedTendersWithBids.length === 0 ? (
            <p className="no-items">No evaluations submitted yet.</p>
          ) : (
            publishedTendersWithBids.map((tender) => {
              // Get bids that have been scored by this evaluator
              const scoredBids = tender.bids.filter(bid => 
                bid.evaluations && bid.evaluations.some(e => e.evaluator_id === user.userId)
              );
              
              if (scoredBids.length === 0) return null;
              
              return (
                <div key={tender.tender_id} className="tender-card">
                  <div className="tender-header">
                    <h3>{tender.title}</h3>
                  </div>
                  
                  <div className="bids-container">
                    <h4>Your Evaluated Bids:</h4>
                    
                    {scoredBids.map((bid) => {
                      const myEvaluation = bid.evaluations.find(e => e.evaluator_id === user.userId);
                      
                      return (
                        <div key={bid.bid_id} className="bid-row scored">
                          <div className="bid-info">
                            <span className="bid-amount">💰 ${parseFloat(bid.amount).toFixed(2)}</span>
                            <span className="bid-date">Submitted: {new Date(bid.submission_date).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="evaluation-info">
                            <span className="score-display">
                              Your Score: <strong>{myEvaluation.score}/10</strong>
                            </span>
                            <span className="evaluation-date">
                              Evaluated on: {new Date(myEvaluation.evaluated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }).filter(Boolean)
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluatorDashboard;
