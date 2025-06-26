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
      v.literal("encouragement")
    ),
    isAnonymous: v.boolean(),
    likes: v.number(),
    image: v.optional(v.id("_storage")),
  }).index("by_category", ["category"])
    .index("by_user", ["userId"]),

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
  }).index("by_date", ["date"]),

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
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
