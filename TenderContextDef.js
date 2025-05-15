// TenderContextDef.js - Context definition
import { createContext } from 'react';

// Create the context with initial values
const TenderContext = createContext({
  tenders: [],
  loading: false,
  error: null,
  createTender: async () => {},
  placeBid: async () => {},
  updateTenderStatus: async () => {},
  scoreBid: async () => {},
  selectWinner: async () => {},
  getTenderWinner: async () => null,
  getAllTenderWinners: async () => [], // Return empty array by default
  setTenders: () => {},
  refreshTenders: async () => {}
});

export default TenderContext;
