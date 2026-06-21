/**
 * Mock database utility for JailBreak
 * Uses local in-memory objects for sandbox compatibility
 * Can be easily swapped for a real database later
 */

// In-memory data stores
const users = new Map();
const posts = new Map();
const follows = new Map();
const likes = new Map();
const inboxActivities = new Map(); // ActivityPub inbox storage

// Helper to generate IDs
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Initialize with some sample data
const initializeSampleData = () => {
  // Sample users
  const sampleUsers = [
    {
      id: 'user_001',
      username: 'alice',
      email: 'alice@jailbreak.social',
      displayName: 'Alice Chen',
      bio: 'Decentralization advocate & open source contributor',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      bannerUrl: '',
      isBot: false,
      botVerified: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      passwordHash: '', // Will be set during registration
    },
    {
      id: 'user_002',
      username: 'newsbot',
      email: 'bot@jailbreak.social',
      displayName: 'JailBreak News Bot',
      bio: 'Automated news aggregation service',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=newsbot',
      bannerUrl: '',
      isBot: true,
      botVerified: true,
      botDescription: 'Aggregates and posts tech news from RSS feeds',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      passwordHash: '',
    },
  ];

  sampleUsers.forEach(user => {
    users.set(user.id, { ...user, postsCount: 0, followersCount: 0, followingCount: 0 });
  });
};

// Initialize sample data on module load
initializeSampleData();

// User operations
export const db = {
  // Users
  getUserById: (id) => users.get(id),

  getUserByUsername: (username) => {
    for (const user of users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  },

  getUserByEmail: (email) => {
    for (const user of users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  },

  createUser: (userData) => {
    const id = generateId();
    const user = {
      id,
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName || userData.username,
      bio: userData.bio || '',
      avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
      bannerUrl: '',
      isBot: false,
      botVerified: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      passwordHash: userData.passwordHash,
    };
    users.set(id, user);
    return user;
  },

  updateUser: (id, updates) => {
    const user = users.get(id);
    if (!user) return null;
    const updatedUser = { ...user, ...updates };
    users.set(id, updatedUser);
    return updatedUser;
  },

  updateUserPassword: (id, passwordHash) => {
    const user = users.get(id);
    if (!user) return false;
    user.passwordHash = passwordHash;
    return true;
  },

  getAllUsers: () => Array.from(users.values()),

  // Posts
  createPost: (userId, content, replyToId = null) => {
    const id = generateId();
    const post = {
      id,
      userId,
      content,
      replyToId,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      repliesCount: 0,
    };
    posts.set(id, post);

    // Update user post count
    const user = users.get(userId);
    if (user) {
      user.postsCount = (user.postsCount || 0) + 1;
    }

    return post;
  },

  getPostById: (id) => posts.get(id),

  getPosts: (limit = 50, offset = 0) => {
    const allPosts = Array.from(posts.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return allPosts.slice(offset, offset + limit);
  },

  getPostsByUser: (userId, limit = 50) => {
    return Array.from(posts.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  },

  deletePost: (id) => {
    const post = posts.get(id);
    if (post) {
      const user = users.get(post.userId);
      if (user) {
        user.postsCount = Math.max(0, (user.postsCount || 0) - 1);
      }
      posts.delete(id);
      return true;
    }
    return false;
  },

  // Follows
  createFollow: (followerId, followingId) => {
    if (followerId === followingId) return null;

    // Check if already following
    for (const follow of follows.values()) {
      if (follow.followerId === followerId && follow.followingId === followingId) {
        return null;
      }
    }

    const id = generateId();
    const follow = {
      id,
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
    };
    follows.set(id, follow);

    // Update counts
    const follower = users.get(followerId);
    const following = users.get(followingId);
    if (follower) follower.followingCount = (follower.followingCount || 0) + 1;
    if (following) following.followersCount = (following.followersCount || 0) + 1;

    return follow;
  },

  deleteFollow: (followerId, followingId) => {
    for (const [id, follow] of follows.entries()) {
      if (follow.followerId === followerId && follow.followingId === followingId) {
        follows.delete(id);

        // Update counts
        const follower = users.get(followerId);
        const following = users.get(followingId);
        if (follower) follower.followingCount = Math.max(0, (follower.followingCount || 0) - 1);
        if (following) following.followersCount = Math.max(0, (following.followersCount || 0) - 1);

        return true;
      }
    }
    return false;
  },

  isFollowing: (followerId, followingId) => {
    for (const follow of follows.values()) {
      if (follow.followerId === followerId && follow.followingId === followingId) {
        return true;
      }
    }
    return false;
  },

  getFollowers: (userId) => {
    return Array.from(follows.values())
      .filter(f => f.followingId === userId)
      .map(f => users.get(f.followerId))
      .filter(Boolean);
  },

  getFollowing: (userId) => {
    return Array.from(follows.values())
      .filter(f => f.followerId === userId)
      .map(f => users.get(f.followingId))
      .filter(Boolean);
  },

  // Likes
  createLike: (userId, postId) => {
    // Check if already liked
    for (const like of likes.values()) {
      if (like.userId === userId && like.postId === postId) {
        return null;
      }
    }

    const id = generateId();
    const like = {
      id,
      userId,
      postId,
      createdAt: new Date().toISOString(),
    };
    likes.set(id, like);

    // Update post likes count
    const post = posts.get(postId);
    if (post) {
      post.likesCount = (post.likesCount || 0) + 1;
    }

    return like;
  },

  deleteLike: (userId, postId) => {
    for (const [id, like] of likes.entries()) {
      if (like.userId === userId && like.postId === postId) {
        likes.delete(id);

        const post = posts.get(postId);
        if (post) {
          post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
        }

        return true;
      }
    }
    return false;
  },

  isLiked: (userId, postId) => {
    for (const like of likes.values()) {
      if (like.userId === userId && like.postId === postId) {
        return true;
      }
    }
    return false;
  },

  getLikesByPost: (postId) => {
    return Array.from(likes.values()).filter(l => l.postId === postId);
  },

  // ActivityPub Inbox
  addInboxActivity: (username, activity) => {
    if (!inboxActivities.has(username)) {
      inboxActivities.set(username, []);
    }
    inboxActivities.get(username).push({
      ...activity,
      receivedAt: new Date().toISOString(),
    });
  },

  getInboxActivities: (username, limit = 50) => {
    const activities = inboxActivities.get(username) || [];
    return activities.slice(-limit);
  },

  // Bot Verification
  verifyBot: (userId, botDescription) => {
    const user = users.get(userId);
    if (!user) return null;

    user.isBot = true;
    user.botVerified = true;
    user.botDescription = botDescription;

    return user;
  },

  unverifyBot: (userId) => {
    const user = users.get(userId);
    if (!user) return null;

    user.isBot = false;
    user.botVerified = false;
    delete user.botDescription;

    return user;
  },

  getBotStatus: (userId) => {
    const user = users.get(userId);
    if (!user) return null;

    return {
      isBot: user.isBot || false,
      botVerified: user.botVerified || false,
      botDescription: user.botDescription || null,
    };
  },
};

export default db;
