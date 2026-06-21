/**
 * ActivityPub implementation for JailBreak
 * Implements Actor profile and Inbox routes for Fediverse compatibility
 */

import db from './db.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

/**
 * Generate ActivityPub Actor JSON-LD for a user
 */
export function createActorProfile(user) {
  const actorUrl = `${BASE_URL}/users/${user.username}`;

  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ],
    id: actorUrl,
    type: 'Person',
    preferredUsername: user.username,
    name: user.displayName,
    summary: user.bio,
    url: actorUrl,
    inbox: `${actorUrl}/inbox`,
    outbox: `${actorUrl}/outbox`,
    followers: `${actorUrl}/followers`,
    following: `${actorUrl}/following`,

    // Public key for signature verification
    publicKey: {
      id: `${actorUrl}#main-key`,
      owner: actorUrl,
      publicKeyPem: user.publicKey || '-----BEGIN PUBLIC KEY-----\nMOCK_PUBLIC_KEY_FOR_DEVELOPMENT\n-----END PUBLIC KEY-----'
    },

    // Profile images
    icon: {
      type: 'Image',
      mediaType: 'image/svg+xml',
      url: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
    },

    // Bot indicator (ActivityStreams extension)
    ...(user.isBot && {
      type: ['Person', 'Application'],
      'mastodon:bot': true
    }),

    endpoints: {
      sharedInbox: `${BASE_URL}/inbox`
    },

    // Additional properties
    published: user.createdAt,
    manuallyApprovesFollowers: false
  };
}

/**
 * Create an ActivityPub activity response
 */
export function createActivity(type, actor, object, additionalProps = {}) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${actor}/activities/${Date.now()}`,
    type,
    actor,
    object,
    published: new Date().toISOString(),
    ...additionalProps
  };
}

/**
 * Handle incoming ActivityPub activities
 */
export function handleIncomingActivity(activity, targetUser) {
  const activityType = activity.type;

  switch (activityType) {
    case 'Follow':
      return handleFollow(activity, targetUser);

    case 'Like':
      return handleLike(activity, targetUser);

    case 'Create':
      return handleCreate(activity, targetUser);

    case 'Announce':
      return handleAnnounce(activity, targetUser);

    case 'Undo':
      return handleUndo(activity, targetUser);

    default:
      console.log(`Unhandled activity type: ${activityType}`);
      return { success: true, message: `Activity ${activityType} received but not processed` };
  }
}

function handleFollow(activity, targetUser) {
  // Store the follow request in inbox
  db.addInboxActivity(targetUser.username, {
    type: 'Follow',
    actor: activity.actor,
    object: activity.object,
    id: activity.id
  });

  // In a full implementation, we would:
  // 1. Validate the actor signature
  // 2. Send an Accept or Reject activity back
  // 3. Update the followers list

  return {
    success: true,
    message: 'Follow request received',
    shouldAccept: true
  };
}

function handleLike(activity, targetUser) {
  db.addInboxActivity(targetUser.username, {
    type: 'Like',
    actor: activity.actor,
    object: activity.object,
    id: activity.id
  });

  return { success: true, message: 'Like activity received' };
}

function handleCreate(activity, targetUser) {
  // Handle incoming posts or other objects
  db.addInboxActivity(targetUser.username, {
    type: 'Create',
    actor: activity.actor,
    object: activity.object,
    id: activity.id
  });

  return { success: true, message: 'Create activity received' };
}

function handleAnnounce(activity, targetUser) {
  // Handle boosts/retweets from other servers
  db.addInboxActivity(targetUser.username, {
    type: 'Announce',
    actor: activity.actor,
    object: activity.object,
    id: activity.id
  });

  return { success: true, message: 'Announce activity received' };
}

function handleUndo(activity, targetUser) {
  // Handle undo of previous activities (unfollow, unlike, etc.)
  db.addInboxActivity(targetUser.username, {
    type: 'Undo',
    actor: activity.actor,
    object: activity.object,
    id: activity.id
  });

  return { success: true, message: 'Undo activity received' };
}

/**
 * Create a Follow accept response
 */
export function createAcceptFollow(followActivity, actorUrl) {
  return createActivity('Accept', actorUrl, followActivity);
}

/**
 * Create a webfinger response for user discovery
 */
export function createWebfingerResponse(username) {
  const actorUrl = `${BASE_URL}/users/${username}`;

  return {
    subject: `acct:${username}@jailbreak.social`,
    aliases: [actorUrl],
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: actorUrl
      },
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: actorUrl
      },
      {
        rel: 'http://ostatus.org/schema/1.0/subscribe',
        template: `${BASE_URL}/authorize_interaction?uri={uri}`
      }
    ]
  };
}

export default {
  createActorProfile,
  createActivity,
  handleIncomingActivity,
  createAcceptFollow,
  createWebfingerResponse
};
