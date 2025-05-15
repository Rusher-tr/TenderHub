import React, { useState, useEffect, useCallback } from 'react';
import * as api from './api';
import { selectWinner as apiSelectWinner, getWinner, getAllWinners } from './api-winner-functions';
import TenderContext from './TenderContextDef';

export const TenderProvider = ({ children }) => {  
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);

  // Fetch tenders on mount
  useEffect(() => {
    setLoading(true);
    api.fetchTenders()
      .then(setTenders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Refresh tenders - utility function to reload tenders from the server
  const refreshTenders = useCallback(async () => {
    setLoading(true);
    try {
      const updated = await api.fetchTenders();
      setTenders(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buyer - Create a new tender
  const createTender = useCallback(async (tender) => {
    setLoading(true);
    setError(null);
    try {
      await api.createTender(tender);
      await refreshTenders(); // Use the refresh function
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [refreshTenders]);
  // Bidder - Place a bid on a tender
  const placeBid = useCallback(async (tenderId, amount) => {
    setLoading(true);
    setError(null);
    try {
      await api.placeBid(tenderId, amount);
      await refreshTenders(); // Use the refresh function to ensure we get the most up-to-date data
    } catch (err) {
      setError(err.message);
      throw err; // Re-throw to allow components to handle the error
    } finally {
      setLoading(false);
    }
  }, [refreshTenders]);  // Admin - Update the status of a tender
  const updateTenderStatus = useCallback(async (tenderId, status) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.updateTenderStatus(tenderId, status);
      
      // Always update the UI to maintain a good user experience
      setTenders(prevTenders => 
        prevTenders.map(tender => 
          tender.tender_id === tenderId 
            ? { ...tender, status: status } 
            : tender
        )
      );
      
      return { success: true, status };
    } catch (err) {
      console.error('Error updating tender status:', err);
      
      // Still update the UI for better UX during development
      setTenders(prevTenders => 
        prevTenders.map(tender => 
          tender.tender_id === tenderId 
            ? { ...tender, status: status } 
            : tender
        )
      );
      
      return { success: false, error: err.message, frontendOnly: true };
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Evaluator - Score a specific bid in a tender
  const scoreBid = useCallback(async (bidId, score) => {
    setLoading(true);
    setError(null);
    try {
      await api.scoreBid(bidId, score);
      await refreshTenders(); // Use the refresh function to ensure we get the most up-to-date data
    } catch (err) {
      setError(err.message);
      throw err; // Re-throw to allow components to handle the error
    } finally {
      setLoading(false);
    }
  }, [refreshTenders]);
  // Admin - Select a winning bid for a tender
  const selectWinner = useCallback(async (tenderId, bidId) => {
    setLoading(true);
    setError(null);
    try {
      await apiSelectWinner(tenderId, bidId);
      await refreshTenders(); // Refresh to get updated tender data
    } catch (err) {
      setError(err.message);
      throw err; // Re-throw to allow components to handle the error
    } finally {
      setLoading(false);
    }
  }, [refreshTenders]);
  // Get winner for a specific tender
  const getTenderWinner = useCallback(async (tenderId) => {
    setLoading(true);
    setError(null);
    try {
      const winner = await getWinner(tenderId);
      return winner;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }  }, []);
  
  // Get all winners (admin only)
  const getAllTenderWinners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // This will now always return an empty array while API is fixed
      const winners = await getAllWinners();
      return winners || [];
    } catch (err) {
      console.error("Error getting winners:", err);
      return []; // Return empty array
    } finally {
      setLoading(false);
    }
  }, []);
  
    return (
    <TenderContext.Provider
      value={{
        tenders,
        loading,
        error,
        createTender,
        placeBid,
        updateTenderStatus,
        scoreBid,
        selectWinner,
        getTenderWinner,
        getAllTenderWinners,
        setTenders,
        refreshTenders
      }}
    >
      {children}
    </TenderContext.Provider>
  );
};
