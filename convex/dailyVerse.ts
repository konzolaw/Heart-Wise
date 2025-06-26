import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getTodaysVerse = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    
    const verse = await ctx.db
      .query("dailyVerses")
      .withIndex("by_date", (q) => q.eq("date", today))
      .unique();

    // If no verse for today, return a default one
    if (!verse) {
      return {
        verse: "Above all else, guard your heart, for everything you do flows from it.",
        reference: "Proverbs 4:23",
        reflection: "In relationships, protecting our hearts means being wise about who we let close to us, while still remaining open to God's love and the love He brings through others.",
        date: today,
      };
    }

    return verse;
  },
});

export const addDailyVerse = mutation({
  args: {
    verse: v.string(),
    reference: v.string(),
    reflection: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dailyVerses", args);
  },
});

export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Add today's verse if it doesn't exist
    const existingVerse = await ctx.db
      .query("dailyVerses")
      .withIndex("by_date", (q) => q.eq("date", today))
      .unique();
    
    if (!existingVerse) {
      await ctx.db.insert("dailyVerses", {
        verse: "Above all else, guard your heart, for everything you do flows from it.",
        reference: "Proverbs 4:23",
        reflection: "In relationships, protecting our hearts means being wise about who we let close to us, while still remaining open to God's love.",
        date: today,
      });
    }
    
    return "Data seeded successfully";
  },
});
