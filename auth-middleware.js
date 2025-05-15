import jwt from 'jsonwebtoken';
import { env } from './env.js';

export function authMiddleware(req, res, next) {  // Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    // Verify token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    if (!decoded || !decoded.userId || !decoded.role) {
      return res.status(401).json({ error: 'Invalid token structure' });
    }
    
    // Validate role is one of the allowed roles
    const validRoles = ['Admin', 'Buyer', 'Bidder', 'Evaluator'];
    if (!validRoles.includes(decoded.role)) {
      return res.status(403).json({ error: 'Invalid role' });
    }
    
    // Set user info from token
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    
    next();
  } catch (err) {
    console.error('🔑 Token verification failed:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
