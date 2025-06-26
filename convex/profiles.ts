import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

export const createOrUpdateProfile = mutation({
  args: {
    displayName: v.string(),
    bio: v.optional(v.string()),
    age: v.optional(v.number()),
    location: v.optional(v.string()),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        displayName: args.displayName,
        bio: args.bio,
        age: args.age,
        location: args.location,
        isPrivate: args.isPrivate,
      });
      return existingProfile._id;
    } else {
      return await ctx.db.insert("profiles", {
        userId,
        displayName: args.displayName,
        bio: args.bio,
        age: args.age,
        location: args.location,
        isPrivate: args.isPrivate,
      });
    }
  },
});
