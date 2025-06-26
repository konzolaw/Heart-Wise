import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getPosts = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let posts;
    
    if (args.category && args.category !== "all") {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_category", (q) => q.eq("category", args.category as any))
        .order("desc")
        .take(20);
    } else {
      posts = await ctx.db.query("posts").order("desc").take(20);
    }
    
    // Get user profiles and like counts
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", post.userId))
          .unique();

        const user = await ctx.db.get(post.userId);
        
        return {
          ...post,
          authorName: post.isAnonymous ? "Anonymous" : (profile?.displayName || user?.email || "Unknown"),
          authorImage: post.isAnonymous ? null : profile?.profileImage,
        };
      })
    );

    return postsWithDetails;
  },
});

export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.union(
      v.literal("advice"),
      v.literal("testimony"),
      v.literal("question"),
      v.literal("encouragement")
    ),
    isAnonymous: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const postId = await ctx.db.insert("posts", {
      userId,
      title: args.title,
      content: args.content,
      category: args.category,
      isAnonymous: args.isAnonymous,
      likes: 0,
    });

    // Create admin notification for new post
    await ctx.db.insert("adminNotifications", {
      type: "new_post",
      title: "New Community Post",
      description: `New ${args.category} post: "${args.title}"`,
      relatedId: postId,
      isRead: false,
      priority: "low",
    });

    return postId;
  },
});

export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingLike = await ctx.db
      .query("postLikes")
      .withIndex("by_user_post", (q) => q.eq("userId", userId).eq("postId", args.postId))
      .unique();

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, { likes: post.likes - 1 });
      return false;
    } else {
      // Like
      await ctx.db.insert("postLikes", {
        postId: args.postId,
        userId,
      });
      await ctx.db.patch(args.postId, { likes: post.likes + 1 });
      return true;
    }
  },
});

export const getPostComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", comment.userId))
          .unique();

        const user = await ctx.db.get(comment.userId);

        return {
          ...comment,
          authorName: comment.isAnonymous ? "Anonymous" : (profile?.displayName || user?.email || "Unknown"),
        };
      })
    );

    return commentsWithAuthors;
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    isAnonymous: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("comments", {
      postId: args.postId,
      userId,
      content: args.content,
      isAnonymous: args.isAnonymous,
    });
  },
});

export const seedSamplePosts = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("posts", {
      userId,
      title: "How do I know if someone is 'the one'?",
      content: "I've been dating someone for 6 months and wondering how to discern if this is the person God has for me.",
      category: "question",
      isAnonymous: false,
      likes: 12,
    });

    return "Sample posts created";
  },
});

export const seedChatRoom = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("chatRooms").first();
    if (!existing) {
      await ctx.db.insert("chatRooms", {
        name: "General Discussion",
        description: "A place for general relationship and dating discussions",
        isActive: true,
      });
    }
    return "Chat room seeded";
  },
});

// Admin check function
async function isAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  const user = await ctx.db.get(userId);
  return user?.email === "admin@heartwise.com";
}

export const getAdminNotifications = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");
    return await ctx.db
      .query("adminNotifications")
      .withIndex("by_read", (q) => q.eq("isRead", false))
      .order("desc")
      .take(20);
  },
});

export const adminRespondAsAI = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      userId: conversation.userId,
      content: args.content,
      isAI: true,
      biblicalReferences: [],
    });
  },
});

export const seedAdminData = mutation({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");
    
    await ctx.db.insert("adminNotifications", {
      type: "new_message",
      title: "User asked about boundaries",
      description: "Anonymous: 'How do I set healthy boundaries?'",
      relatedId: "sample_1",
      isRead: false,
      priority: "medium",
    });

    return "Admin data seeded";
  },
});
