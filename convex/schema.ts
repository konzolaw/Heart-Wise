import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles
  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    bio: v.optional(v.string()),
    age: v.optional(v.number()),
    location: v.optional(v.string()),
    profileImage: v.optional(v.id("_storage")),
    isPrivate: v.boolean(),
  }).index("by_user", ["userId"]),

  // AI Chat conversations
  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    isActive: v.boolean(),
  }).index("by_user", ["userId"]),

  // Chat messages
  messages: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    content: v.string(),
    isAI: v.boolean(),
    biblicalReferences: v.optional(v.array(v.string())),
  }).index("by_conversation", ["conversationId"]),

  // Community posts
  posts: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    category: v.union(
      v.literal("advice"),
      v.literal("testimony"),
      v.literal("question"),
      v.literal("encouragement"),
      v.literal("announcement")
    ),
    isAnonymous: v.boolean(),
    realAuthorId: v.optional(v.id("users")), // Always track real author for admin
    likes: v.number(),
    dislikes: v.optional(v.number()),
    image: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
  }).index("by_category", ["category"])
    .index("by_user", ["userId"])
    .index("by_real_author", ["realAuthorId"]),

  // Post likes
  postLikes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
  }).index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),

  // Comments on posts
  comments: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    content: v.string(),
    isAnonymous: v.boolean(),
  }).index("by_post", ["postId"]),

  // Testimonies
  testimonies: defineTable({
    userId: v.id("users"),
    title: v.string(),
    story: v.string(),
    isAnonymous: v.boolean(),
    isApproved: v.boolean(),
    category: v.union(
      v.literal("relationship"),
      v.literal("marriage"),
      v.literal("healing"),
      v.literal("guidance")
    ),
  }).index("by_approved", ["isApproved"])
    .index("by_category", ["category"]),

  // Daily verses/inspiration
  dailyVerses: defineTable({
    verse: v.string(),
    reference: v.string(),
    reflection: v.string(),
    date: v.string(),
    isAIGenerated: v.optional(v.boolean()),
    topic: v.optional(v.string()),
    minuteKey: v.optional(v.string()), // For minute-based updates
    lastUpdated: v.optional(v.number()),
  }).index("by_date", ["date"])
    .index("by_minute_key", ["minuteKey"]),

  // Community chat rooms
  chatRooms: defineTable({
    name: v.string(),
    description: v.string(),
    isActive: v.boolean(),
  }),

  // Community chat messages
  chatMessages: defineTable({
    roomId: v.id("chatRooms"),
    userId: v.id("users"),
    content: v.string(),
    isAnonymous: v.boolean(),
  }).index("by_room", ["roomId"]),

  // Admin notifications
  adminNotifications: defineTable({
    type: v.union(
      v.literal("new_message"),
      v.literal("new_post"),
      v.literal("new_testimony"),
      v.literal("flagged_content")
    ),
    title: v.string(),
    description: v.string(),
    relatedId: v.optional(v.string()),
    isRead: v.boolean(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  }).index("by_read", ["isRead"]),

  // Admin responses (to track admin interventions)
  adminResponses: defineTable({
    conversationId: v.id("conversations"),
    originalMessageId: v.id("messages"),
    adminContent: v.string(),
    isPublished: v.boolean(),
  }).index("by_conversation", ["conversationId"]),

  // Video calls
  videoCalls: defineTable({
    roomId: v.id("chatRooms"),
    hostUserId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    meetingUrl: v.string(),
    scheduledTime: v.optional(v.number()),
    isActive: v.boolean(),
    maxParticipants: v.number(),
    currentParticipants: v.number(),
  }).index("by_room", ["roomId"])
    .index("by_host", ["hostUserId"])
    .index("by_active", ["isActive"]),

  // Video call participants
  videoCallParticipants: defineTable({
    callId: v.id("videoCalls"),
    userId: v.id("users"),
    joinedAt: v.number(),
    leftAt: v.optional(v.number()),
    isActive: v.boolean(),
  }).index("by_call", ["callId"])
    .index("by_user", ["userId"]),

  // Password reset tokens
  passwordResetTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    isUsed: v.boolean(),
  }).index("by_user", ["userId"])
    .index("by_token", ["token"]),

  // User reactions to posts (likes/dislikes)
  postReactions: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    reaction: v.union(v.literal("like"), v.literal("dislike")),
  }).index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),

  // Comments on posts
  postComments: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    content: v.string(),
    isAnonymous: v.boolean(),
  }).index("by_post", ["postId"])
    .index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
