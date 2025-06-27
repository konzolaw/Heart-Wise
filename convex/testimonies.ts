import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getApprovedTestimonies = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("testimonies")
      .withIndex("by_approved", (q) => q.eq("isApproved", true));

    if (args.category && args.category !== "all") {
      query = ctx.db
        .query("testimonies")
        .withIndex("by_category", (q) => q.eq("category", args.category as any))
        .filter((q) => q.eq(q.field("isApproved"), true));
    }

    const testimonies = await query.order("desc").take(10);

    const testimoniesWithAuthors = await Promise.all(
      testimonies.map(async (testimony) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", testimony.userId))
          .unique();

        const user = await ctx.db.get(testimony.userId);

        return {
          ...testimony,
          authorName: testimony.isAnonymous ? "Anonymous" : (profile?.displayName || user?.email || "A Believer"),
        };
      })
    );

    return testimoniesWithAuthors;
  },
});

export const submitTestimony = mutation({
  args: {
    title: v.string(),
    story: v.string(),
    category: v.union(
      v.literal("relationship"),
      v.literal("marriage"),
      v.literal("healing"),
      v.literal("guidance")
    ),
    isAnonymous: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const testimonyId = await ctx.db.insert("testimonies", {
      userId,
      title: args.title,
      story: args.story,
      category: args.category,
      isAnonymous: args.isAnonymous,
      isApproved: false, // Requires approval
    });

    // Create admin notification for new testimony
    await ctx.db.insert("adminNotifications", {
      type: "new_testimony",
      title: "New Testimony Submitted",
      description: `New testimony: "${args.title}" - Requires approval`,
      relatedId: testimonyId,
      isRead: false,
      priority: "high",
    });

    return testimonyId;
  },
});

// Admin: Get testimony statistics
export const getTestimonyStats = query({
  args: {},
  handler: async (ctx) => {
    const total = await ctx.db.query("testimonies").collect().then(testimonies => testimonies.length);
    const approved = await ctx.db
      .query("testimonies")
      .withIndex("by_approved", (q) => q.eq("isApproved", true))
      .collect().then(testimonies => testimonies.length);
    const pending = await ctx.db
      .query("testimonies")
      .withIndex("by_approved", (q) => q.eq("isApproved", false))
      .collect().then(testimonies => testimonies.length);

    return {
      total,
      approved,
      pending,
    };
  },
});

// Admin: Get pending testimonies
export const getPendingTestimonies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.email !== "admin@heartwise.com") {
      throw new Error("Admin access required");
    }

    const pendingTestimonies = await ctx.db
      .query("testimonies")
      .withIndex("by_approved", (q) => q.eq("isApproved", false))
      .order("desc")
      .collect();

    const testimoniesWithAuthors = await Promise.all(
      pendingTestimonies.map(async (testimony) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", testimony.userId))
          .unique();

        const user = await ctx.db.get(testimony.userId);

        return {
          ...testimony,
          authorName: testimony.isAnonymous ? "Anonymous" : (profile?.displayName || user?.email || "A Believer"),
          authorEmail: user?.email,
        };
      })
    );

    return testimoniesWithAuthors;
  },
});

// Admin: Approve testimony
export const approveTestimony = mutation({
  args: { testimonyId: v.id("testimonies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.email !== "admin@heartwise.com") {
      throw new Error("Admin access required");
    }

    await ctx.db.patch(args.testimonyId, { isApproved: true });
    return "Testimony approved successfully";
  },
});

// Admin: Reject testimony
export const rejectTestimony = mutation({
  args: { testimonyId: v.id("testimonies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.email !== "admin@heartwise.com") {
      throw new Error("Admin access required");
    }

    await ctx.db.delete(args.testimonyId);
    return "Testimony rejected and deleted";
  },
});

// Seed function to populate testimonies (for production setup)
export const seedTestimonies = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if testimonies already exist
    const existingTestimonies = await ctx.db.query("testimonies").take(1);
    if (existingTestimonies.length > 0) {
      return "Testimonies already exist, skipping seed";
    }

    // Create sample users for testimonies
    const users = [
      { email: "sarah.m@example.com" },
      { email: "michael.k@example.com" },
      { email: "grace.t@example.com" },
      { email: "david.r@example.com" },
      { email: "rachel.l@example.com" },
    ];

    const userIds = [];
    for (const user of users) {
      const userId = await ctx.db.insert("users", user);
      userIds.push(userId);
      
      // Create profiles
      await ctx.db.insert("profiles", {
        userId,
        displayName: user.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        bio: "A believer sharing God's love",
        age: 25 + Math.floor(Math.random() * 15),
        location: "United States",
        isPrivate: false,
      });
    }

    // Sample testimonies
    const testimonies = [
      {
        userId: userIds[0],
        title: "God Brought Us Together Through Faith",
        story: "I was praying for a godly partner for years. Through this community and God's guidance, I met my husband. We both prioritized Christ in our relationship from day one, and now we're blessed with a marriage that glorifies God. Thank you for creating this space where believers can connect authentically.",
        category: "relationship" as const,
        isAnonymous: false,
        isApproved: true,
      },
      {
        userId: userIds[1],
        title: "Healing After Heartbreak",
        story: "After a painful breakup, I found solace in the daily verses and community support here. God used this season to draw me closer to Him and prepare my heart for His best. The biblical dating principles shared here helped me understand my worth in Christ.",
        category: "healing" as const,
        isAnonymous: false,
        isApproved: true,
      },
      {
        userId: userIds[2],
        title: "Divine Guidance in Choosing My Spouse",
        story: "The advice and biblical teachings here helped me discern God's will in my relationship. Instead of rushing, we took time to pray, seek counsel, and build our friendship first. Now we're engaged and planning a Christ-centered wedding!",
        category: "guidance" as const,
        isAnonymous: false,
        isApproved: true,
      },
      {
        userId: userIds[3],
        title: "Transformed Marriage Through Biblical Principles",
        story: "Our marriage was struggling, but the biblical advice shared in this community helped us rediscover God's design for marriage. We learned to love sacrificially, communicate with grace, and put Christ at the center. Our relationship is stronger than ever.",
        category: "marriage" as const,
        isAnonymous: false,
        isApproved: true,
      },
      {
        userId: userIds[4],
        title: "God's Perfect Timing",
        story: "I was getting impatient waiting for the right person, but the community here encouraged me to trust God's timing. When I stopped forcing things and focused on growing in faith, God brought an amazing godly man into my life. His timing is always perfect!",
        category: "relationship" as const,
        isAnonymous: true,
        isApproved: true,
      },
      {
        userId: userIds[0],
        title: "Learning to Wait with Hope",
        story: "Being single in a couples-focused church was hard, but this community reminded me that my identity is in Christ, not my relationship status. I've learned to use this season to serve God and grow spiritually. Whether He calls me to marriage or singleness, I'm content in Him.",
        category: "guidance" as const,
        isAnonymous: false,
        isApproved: true,
      },
    ];

    // Insert testimonies
    for (const testimony of testimonies) {
      await ctx.db.insert("testimonies", testimony);
    }

    return "Testimonies seeded successfully!";
  },
});
