import express from "express";
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { env } from "./fort/env.js";
import { scheduleAutoArchiving } from "./utils/archive-tenders.js";

// Route imports
import authRoutes from './routes/auth.routes.js';
import tenderRoutes from './routes/tender.routes.js';
import bidRoutes from './routes/bid.routes.js';  // Now correctly importing the new file
import evaluationRoutes from './routes/evaluation.routes.js';
import winnerRoutes from './routes/winner.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT parsing middleware
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = {
        userId: decoded.userId,
        role: decoded.role
      };
    } catch (err) {
      console.error('?? Token verification failed:', err);
    }
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/bids', bidRoutes);  // This will now work with our new file

// The routes below may also need to be created if they don't exist yet
// Check if these files exist before trying to use them
try {
  app.use('/api/evaluations', evaluationRoutes);
} catch (err) {
  console.warn('Evaluation routes not fully implemented yet:', err.message);
}

try {
  app.use('/api/winners', winnerRoutes);
} catch (err) {
  console.warn('Winner routes not fully implemented yet:', err.message);
}

// Add a health check endpoint
app.get('/api/health-check', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Make sure the published tenders endpoint is registered and working
console.log('Routes registered, including GET /api/tenders/published for bidders');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('?? Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
  
  // Set up automated archiving of expired tenders
  // Run every hour (60 minutes)
  const archiveSchedule = scheduleAutoArchiving(60);
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    clearInterval(archiveSchedule);
    server.close(() => {
      console.log('Process terminated');
    });
  });
});
