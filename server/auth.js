/**
 * Authentication utilities for JailBreak
 * JWT-based authentication with bcrypt password hashing
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'jailbreak-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    isBot: user.isBot || false
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Authentication middleware for Express
 */
export function authMiddleware(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Attach user info to request
  req.user = decoded;
  next();
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function optionalAuthMiddleware(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

/**
 * Register a new user
 */
export async function registerUser(email, username, password, displayName) {
  // Check if user already exists
  const existingByEmail = db.getUserByEmail(email);
  if (existingByEmail) {
    return { error: 'Email already registered', status: 400 };
  }

  const existingByUsername = db.getUserByUsername(username);
  if (existingByUsername) {
    return { error: 'Username already taken', status: 400 };
  }

  // Validate inputs
  if (!username || username.length < 2 || username.length > 30) {
    return { error: 'Username must be between 2 and 30 characters', status: 400 };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { error: 'Username can only contain letters, numbers, and underscores', status: 400 };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Invalid email address', status: 400 };
  }

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters', status: 400 };
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const user = db.createUser({
    email,
    username: username.toLowerCase(),
    passwordHash,
    displayName: displayName || username
  });

  // Generate token
  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token,
    status: 201
  };
}

/**
 * Login a user
 */
export async function loginUser(email, password) {
  const user = db.getUserByEmail(email);

  if (!user) {
    return { error: 'Invalid email or password', status: 401 };
  }

  if (!user.passwordHash) {
    return { error: 'Account not properly configured', status: 400 };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: 'Invalid email or password', status: 401 };
  }

  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token,
    status: 200
  };
}

/**
 * Get user from token
 */
export function getUserFromToken(token) {
  const decoded = verifyToken(token);
  if (!decoded) return null;

  return db.getUserById(decoded.userId);
}

/**
 * Remove sensitive fields from user object
 */
export function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export default {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuthMiddleware,
  registerUser,
  loginUser,
  getUserFromToken,
  sanitizeUser
};
