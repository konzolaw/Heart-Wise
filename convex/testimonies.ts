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
