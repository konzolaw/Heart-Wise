import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper function to check if user is admin
async function isAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  
  const user = await ctx.db.get(userId);
  return user?.email === "admin@heartwise.com";
}

export const getChatRooms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("chatRooms")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getChatMessages = query({
  args: { roomId: v.id("chatRooms") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(50);

    // Get user profiles for messages
    const messagesWithProfiles = await Promise.all(
      messages.map(async (message) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", message.userId))
          .unique();
        
        const user = await ctx.db.get(message.userId);
        
        return {
          ...message,
          authorName: message.isAnonymous ? "Anonymous" : (profile?.displayName || user?.email || "Unknown"),
          authorImage: message.isAnonymous ? null : profile?.profileImage,
        };
      })
    );

    return messagesWithProfiles.reverse(); // Return in chronological order
  },
});

export const sendChatMessage = mutation({
  args: {
    roomId: v.id("chatRooms"),
    content: v.string(),
    isAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const messageId = await ctx.db.insert("chatMessages", {
      roomId: args.roomId,
      userId,
      content: args.content.trim(),
      isAnonymous: args.isAnonymous || false,
    });

    return messageId;
  },
});

export const createChatRoom = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const roomId = await ctx.db.insert("chatRooms", {
      name: args.name,
      description: args.description,
      isActive: true,
    });

    return roomId;
  },
});

export const deleteChatRoom = mutation({
  args: { roomId: v.id("chatRooms") },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");

    await ctx.db.patch(args.roomId, {
      isActive: false,
    });

    return "Chat room deleted successfully";
  },
});

export const seedChatRooms = mutation({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");

    const existingRooms = await ctx.db.query("chatRooms").collect();
    if (existingRooms.length > 0) {
      return "Chat rooms already exist";
    }

    // Create default chat rooms
    const rooms = [
      {
        name: "General Fellowship",
        description: "General discussion for all community members to fellowship and share",
      },
      {
        name: "Dating Advice",
        description: "Share and discuss biblical dating advice and experiences",
      },
      {
        name: "Prayer Requests",
        description: "Share prayer requests and pray for one another",
      },
      {
        name: "Marriage Prep",
        description: "For those preparing for marriage or engaged couples",
      },
      {
        name: "Single & Seeking",
        description: "Support group for singles seeking God's will in relationships",
      },
    ];

    for (const room of rooms) {
      await ctx.db.insert("chatRooms", {
        name: room.name,
        description: room.description,
        isActive: true,
      });
    }

    return "Default chat rooms created successfully";
  },
});

export const seedChatRoomsPublic = mutation({
  args: {},
  handler: async (ctx) => {
    const existingRooms = await ctx.db.query("chatRooms").collect();
    if (existingRooms.length > 0) {
      return { success: true, message: "Chat rooms already exist", count: existingRooms.length };
    }

    // Create default chat rooms
    const rooms = [
      {
        name: "General Fellowship",
        description: "General discussion for all community members to fellowship and share",
      },
      {
        name: "Dating Advice",
        description: "Share and discuss biblical dating advice and experiences",
      },
      {
        name: "Prayer Requests",
        description: "Share prayer requests and pray for one another",
      },
      {
        name: "Marriage Prep",
        description: "For those preparing for marriage or engaged couples",
      },
      {
        name: "Single & Seeking",
        description: "Support group for singles seeking God's will in relationships",
      },
      {
        name: "Faith & Relationships",
        description: "Discuss how faith impacts our relationships and dating life",
      },
      {
        name: "Testimonies & Stories",
        description: "Share your testimony and relationship success stories",
      },
    ];

    let createdCount = 0;
    for (const room of rooms) {
      await ctx.db.insert("chatRooms", {
        name: room.name,
        description: room.description,
        isActive: true,
      });
      createdCount++;
    }

    return { success: true, message: `Created ${createdCount} chat rooms successfully`, count: createdCount };
  },
});
