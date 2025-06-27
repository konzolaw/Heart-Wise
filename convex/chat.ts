import { v } from "convex/values";
import { query, mutation, action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const getUserConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getConversationMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify user owns this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

export const getConversationMessagesInternal = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

export const createConversation = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("conversations", {
      userId,
      title: args.title,
      isActive: true,
    });
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify user owns this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Insert user message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      userId,
      content: args.content,
      isAI: false,
    });

    // Create admin notification for new message
    await ctx.db.insert("adminNotifications", {
      type: "new_message",
      title: "New AI Chat Message",
      description: `User sent: "${args.content.substring(0, 50)}${args.content.length > 50 ? '...' : ''}"`,
      relatedId: messageId,
      isRead: false,
      priority: "medium",
    });

    // Schedule AI response
    await ctx.scheduler.runAfter(0, internal.chat.generateAIResponse, {
      conversationId: args.conversationId,
      userMessage: args.content,
    });

    return messageId;
  },
});

export const generateAIResponse = internalAction({
  args: {
    conversationId: v.id("conversations"),
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // Get conversation history using internal query
    const messages = await ctx.runQuery(internal.chat.getConversationMessagesInternal, {
      conversationId: args.conversationId,
    });

    // Build context for AI
    const conversationHistory = messages
      .slice(-10) // Last 10 messages for context
      .map(msg => ({
        role: msg.isAI ? "assistant" as const : "user" as const,
        content: msg.content,
      }));

    const systemPrompt = `You are a wise, compassionate Christian counselor specializing in Biblical dating and relationship advice. Your responses should:

1. Be grounded in Biblical principles and scripture
2. Offer practical, loving guidance
3. Include relevant Bible verses when appropriate
4. Be encouraging and non-judgmental
5. Promote healthy, God-honoring relationships
6. Address both emotional and spiritual aspects
7. Keep responses concise but meaningful (2-3 paragraphs max)

Always include at least one relevant Bible verse reference in your response. Focus on love, respect, patience, and God's design for relationships.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: args.userMessage },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0].message.content;
      if (!aiResponse) throw new Error("No AI response generated");

      // Extract biblical references (simple regex for common patterns)
      const biblicalRefs = aiResponse.match(/\b\d*\s*[A-Z][a-z]+\s+\d+:\d+(-\d+)?\b/g) || [];

      // Save AI response
      await ctx.runMutation(internal.chat.saveAIMessage, {
        conversationId: args.conversationId,
        content: aiResponse,
        biblicalReferences: biblicalRefs,
      });

    } catch (error) {
      console.error("AI response generation failed:", error);
      // Fallback response
      await ctx.runMutation(internal.chat.saveAIMessage, {
        conversationId: args.conversationId,
        content: "I'm here to help with your relationship questions. Could you share more about what's on your heart? Remember, 'Trust in the Lord with all your heart and lean not on your own understanding.' - Proverbs 3:5",
        biblicalReferences: ["Proverbs 3:5"],
      });
    }
  },
});

export const saveAIMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    biblicalReferences: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the conversation to get the userId
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      userId: conversation.userId,
      content: args.content,
      isAI: true,
      biblicalReferences: args.biblicalReferences,
    });
  },
});

export const renameConversation = mutation({
  args: { 
    conversationId: v.id("conversations"),
    newTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify user owns this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.conversationId, {
      title: args.newTitle.trim(),
    });

    return "Conversation renamed successfully";
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify user owns this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Mark conversation as inactive instead of deleting
    await ctx.db.patch(args.conversationId, {
      isActive: false,
    });

    return "Conversation deleted successfully";
  },
});
