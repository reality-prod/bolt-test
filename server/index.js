/**
 * JailBreak Backend Server
 * Express server with ActivityPub, JWT Auth, and Bot Verification
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db.js';
import { authMiddleware, registerUser, loginUser, sanitizeUser } from './auth.js';
import {
  createActorProfile,
  handleIncomingActivity,
  createWebfingerResponse
} from './activitypub.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ============================================
// Health Check
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Authentication Routes
// ============================================

/**
 * Register a new user
 * POST /api/auth/register
 */
app.post('/api/auth/register', async (req, res) => {
  const { email, username, password, displayName } = req.body;

  const result = await registerUser(email, username, password, displayName);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.status(result.status).json({
    message: 'Registration successful',
    user: result.user,
    token: result.token
  });
});

/**
 * Login
 * POST /api/auth/login
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const result = await loginUser(email, password);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json({
    message: 'Login successful',
    user: result.user,
    token: result.token
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.getUserById(req.user.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: sanitizeUser(user) });
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
app.put('/api/auth/profile', authMiddleware, (req, res) => {
  const { displayName, bio, avatarUrl, bannerUrl } = req.body;

  const updated = db.updateUser(req.user.userId, {
    displayName,
    bio,
    avatarUrl,
    bannerUrl,
    updatedAt: new Date().toISOString()
  });

  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: sanitizeUser(updated), message: 'Profile updated' });
});

// ============================================
// User Routes
// ============================================

/**
 * Get all users (for discovery)
 * GET /api/users
 */
app.get('/api/users', (req, res) => {
  const users = db.getAllUsers()
    .filter(u => u.id !== req.user?.userId)
    .map(sanitizeUser)
    .slice(0, 50);

  res.json({ users });
});

/**
 * Get user by username
 * GET /api/users/:username
 */
app.get('/api/users/:username', (req, res) => {
  const user = db.getUserByUsername(req.params.username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: sanitizeUser(user) });
});

/**
 * Get user's posts
 * GET /api/users/:username/posts
 */
app.get('/api/users/:username/posts', (req, res) => {
  const user = db.getUserByUsername(req.params.username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const posts = db.getPostsByUser(user.id);
  res.json({ posts, user: sanitizeUser(user) });
});

// ============================================
// Post Routes
// ============================================

/**
 * Get feed posts
 * GET /api/posts
 */
app.get('/api/posts', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const posts = db.getPosts(parseInt(limit), parseInt(offset));

  const postsWithUsers = posts.map(post => ({
    ...post,
    user: sanitizeUser(db.getUserById(post.userId))
  }));

  res.json({ posts: postsWithUsers });
});

/**
 * Create a new post
 * POST /api/posts
 */
app.post('/api/posts', authMiddleware, (req, res) => {
  const { content, replyToId } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Post content is required' });
  }

  if (content.length > 500) {
    return res.status(400).json({ error: 'Post must be 500 characters or less' });
  }

  const post = db.createPost(req.user.userId, content.trim(), replyToId);

  res.status(201).json({
    message: 'Post created',
    post: {
      ...post,
      user: sanitizeUser(db.getUserById(post.userId))
    }
  });
});

/**
 * Get single post
 * GET /api/posts/:id
 */
app.get('/api/posts/:id', (req, res) => {
  const post = db.getPostById(req.params.id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  res.json({
    post: {
      ...post,
      user: sanitizeUser(db.getUserById(post.userId))
    }
  });
});

/**
 * Delete a post
 * DELETE /api/posts/:id
 */
app.delete('/api/posts/:id', authMiddleware, (req, res) => {
  const post = db.getPostById(req.params.id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (post.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized to delete this post' });
  }

  db.deletePost(req.params.id);
  res.json({ message: 'Post deleted' });
});

/**
 * Like a post
 * POST /api/posts/:id/like
 */
app.post('/api/posts/:id/like', authMiddleware, (req, res) => {
  const post = db.getPostById(req.params.id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const like = db.createLike(req.user.userId, req.params.id);

  if (!like) {
    return res.status(400).json({ error: 'Already liked' });
  }

  res.json({ message: 'Post liked', liked: true });
});

/**
 * Unlike a post
 * DELETE /api/posts/:id/like
 */
app.delete('/api/posts/:id/like', authMiddleware, (req, res) => {
  db.deleteLike(req.user.userId, req.params.id);
  res.json({ message: 'Post unliked', liked: false });
});

// ============================================
// Follow Routes
// ============================================

/**
 * Follow a user
 * POST /api/users/:username/follow
 */
app.post('/api/users/:username/follow', authMiddleware, (req, res) => {
  const targetUser = db.getUserByUsername(req.params.username);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (targetUser.id === req.user.userId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  const follow = db.createFollow(req.user.userId, targetUser.id);

  if (!follow) {
    return res.status(400).json({ error: 'Already following' });
  }

  res.json({ message: 'Now following', following: true });
});

/**
 * Unfollow a user
 * DELETE /api/users/:username/follow
 */
app.delete('/api/users/:username/follow', authMiddleware, (req, res) => {
  const targetUser = db.getUserByUsername(req.params.username);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.deleteFollow(req.user.userId, targetUser.id);
  res.json({ message: 'Unfollowed', following: false });
});

// ============================================
// Bot Verification Routes
// ============================================

/**
 * Set bot status for user
 * POST /api/users/:username/bot
 */
app.post('/api/users/:username/bot', authMiddleware, (req, res) => {
  const targetUser = db.getUserByUsername(req.params.username);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Only allow self or admin (future: add admin check)
  if (targetUser.id !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { isBot, botDescription } = req.body;

  let updatedUser;
  if (isBot) {
    updatedUser = db.verifyBot(targetUser.id, botDescription);
  } else {
    updatedUser = db.unverifyBot(targetUser.id);
  }

  res.json({
    message: isBot ? 'Bot status enabled' : 'Bot status disabled',
    user: sanitizeUser(updatedUser)
  });
});

/**
 * Get bot verification status
 * GET /api/users/:username/bot
 */
app.get('/api/users/:username/bot', (req, res) => {
  const user = db.getUserByUsername(req.params.username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const botStatus = db.getBotStatus(user.id);

  res.json({ ...botStatus, username: user.username });
});

// ============================================
// ActivityPub Routes
// ============================================

/**
 * Webfinger endpoint for user discovery
 * GET /.well-known/webfinger
 */
app.get('/.well-known/webfinger', (req, res) => {
  const resource = req.query.resource;

  if (!resource || !resource.startsWith('acct:')) {
    return res.status(400).json({ error: 'Invalid resource format' });
  }

  const [username, domain] = resource.slice(5).split('@');
  const user = db.getUserByUsername(username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(createWebfingerResponse(username));
});

/**
 * ActivityPub Actor profile
 * GET /users/:username
 */
app.get('/users/:username', (req, res) => {
  const user = db.getUserByUsername(req.params.username);

  if (!user) {
    return res.status(404).json({ error: 'Actor not found' });
  }

  // Return ActivityPub JSON-LD
  res.setHeader('Content-Type', 'application/activity+json');
  res.json(createActorProfile(user));
});

/**
 * ActivityPub Inbox
 * POST /users/:username/inbox
 */
app.post('/users/:username/inbox', express.json({ type: 'application/activity+json' }), (req, res) => {
  const user = db.getUserByUsername(req.params.username);

  if (!user) {
    return res.status(404).json({ error: 'Actor not found' });
  }

  const activity = req.body;

  // Validate activity
  if (!activity.type || !activity.actor) {
    return res.status(400).json({ error: 'Invalid activity format' });
  }

  // Handle the activity
  const result = handleIncomingActivity(activity, user);

  // Log for debugging
  console.log(`Inbox activity received for ${user.username}:`, activity.type);

  res.status(200).json({
    received: true,
    type: activity.type,
    message: result.message
  });
});

/**
 * ActivityPub Outbox (read-only for now)
 * GET /users/:username/outbox
 */
app.get('/users/:username/outbox', (req, res) => {
  const user = db.getUserByUsername(req.params.username);

  if (!user) {
    return res.status(404).json({ error: 'Actor not found' });
  }

  const posts = db.getPostsByUser(user.id, 20);

  res.setHeader('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    totalItems: posts.length,
    orderedItems: posts.map(post => ({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Note',
      id: `${process.env.BASE_URL || 'http://localhost:3001'}/posts/${post.id}`,
      attributedTo: `${process.env.BASE_URL || 'http://localhost:3001'}/users/${user.username}`,
      content: post.content,
      published: post.createdAt,
      to: ['https://www.w3.org/ns/activitystreams#Public']
    }))
  });
});

/**
 * ActivityPub Followers
 * GET /users/:username/followers
 */
app.get('/users/:username/followers', (req, res) => {
  const user = db.getUserByUsername(req.params.username);

  if (!user) {
    return res.status(404).json({ error: 'Actor not found' });
  }

  const followers = db.getFollowers(user.id);

  res.setHeader('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    totalItems: followers.length,
    orderedItems: followers.map(f =>
      `${process.env.BASE_URL || 'http://localhost:3001'}/users/${f.username}`
    )
  });
});

/**
 * ActivityPub Following
 * GET /users/:username/following
 */
app.get('/users/:username/following', (req, res) => {
  const user = db.getUserByUsername(req.params.username);

  if (!user) {
    return res.status(404).json({ error: 'Actor not found' });
  }

  const following = db.getFollowing(user.id);

  res.setHeader('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    totalItems: following.length,
    orderedItems: following.map(f =>
      `${process.env.BASE_URL || 'http://localhost:3001'}/users/${f.username}`
    )
  });
});

// Shared inbox
app.post('/inbox', express.json({ type: 'application/activity+json' }), (req, res) => {
  console.log('Shared inbox received:', req.body.type);
  res.status(200).json({ received: true });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 JailBreak Server running on http://localhost:${PORT}`);
  console.log(`📡 ActivityPub endpoint: http://localhost:${PORT}/users/:username`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`✅ Ready to federate!\n`);
});

export default app;
