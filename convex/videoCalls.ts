import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate a simple meeting room ID
function generateMeetingId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const getActiveVideoCalls = query({
  args: { roomId: v.optional(v.id("chatRooms")) },
  handler: async (ctx, args) => {
    let query;
    
    if (args.roomId) {
      query = ctx.db
        .query("videoCalls")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId!))
        .filter((q) => q.eq(q.field("isActive"), true));
    } else {
      query = ctx.db
        .query("videoCalls")
        .withIndex("by_active", (q) => q.eq("isActive", true));
    }

    const calls = await query.collect();

    // Get host info for each call
    const callsWithHosts = await Promise.all(
      calls.map(async (call) => {
        const hostProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", call.hostUserId))
          .unique();
        
        const hostUser = await ctx.db.get(call.hostUserId);
        
        return {
          ...call,
          hostName: hostProfile?.displayName || hostUser?.email || "Unknown",
        };
      })
    );

    return callsWithHosts;
  },
});

export const createVideoCall = mutation({
  args: {
    roomId: v.id("chatRooms"),
    title: v.string(),
    description: v.optional(v.string()),
    maxParticipants: v.optional(v.number()),
    scheduledTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const meetingId = generateMeetingId();
    const meetingUrl = `https://meet.jit.si/HeartWise-${meetingId}`;

    const callId = await ctx.db.insert("videoCalls", {
      roomId: args.roomId,
      hostUserId: userId,
      title: args.title,
      description: args.description || "",
      meetingUrl,
      scheduledTime: args.scheduledTime,
      isActive: true,
      maxParticipants: args.maxParticipants || 10,
      currentParticipants: 0,
    });

    return { callId, meetingUrl };
  },
});

export const joinVideoCall = mutation({
  args: { callId: v.id("videoCalls") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const call = await ctx.db.get(args.callId);
    if (!call || !call.isActive) {
      throw new Error("Call not found or inactive");
    }

    if (call.currentParticipants >= call.maxParticipants) {
      throw new Error("Call is full");
    }

    // Check if user is already in the call
    const existingParticipant = await ctx.db
      .query("videoCallParticipants")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .filter((q) => q.and(
        q.eq(q.field("userId"), userId),
        q.eq(q.field("isActive"), true)
      ))
      .unique();

    if (existingParticipant) {
      return { meetingUrl: call.meetingUrl, alreadyJoined: true };
    }

    // Add participant
    await ctx.db.insert("videoCallParticipants", {
      callId: args.callId,
      userId,
      joinedAt: Date.now(),
      isActive: true,
    });

    // Update participant count
    await ctx.db.patch(args.callId, {
      currentParticipants: call.currentParticipants + 1,
    });

    return { meetingUrl: call.meetingUrl, alreadyJoined: false };
  },
});

export const leaveVideoCall = mutation({
  args: { callId: v.id("videoCalls") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const participant = await ctx.db
      .query("videoCallParticipants")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .filter((q) => q.and(
        q.eq(q.field("userId"), userId),
        q.eq(q.field("isActive"), true)
      ))
      .unique();

    if (participant) {
      await ctx.db.patch(participant._id, {
        leftAt: Date.now(),
        isActive: false,
      });

      const call = await ctx.db.get(args.callId);
      if (call) {
        await ctx.db.patch(args.callId, {
          currentParticipants: Math.max(0, call.currentParticipants - 1),
        });
      }
    }

    return "Left call successfully";
  },
});

export const endVideoCall = mutation({
  args: { callId: v.id("videoCalls") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const call = await ctx.db.get(args.callId);
    if (!call || call.hostUserId !== userId) {
      throw new Error("Unauthorized to end this call");
    }

    // Mark call as inactive
    await ctx.db.patch(args.callId, {
      isActive: false,
      currentParticipants: 0,
    });

    // Mark all participants as inactive
    const participants = await ctx.db
      .query("videoCallParticipants")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const participant of participants) {
      await ctx.db.patch(participant._id, {
        leftAt: Date.now(),
        isActive: false,
      });
    }

    return "Call ended successfully";
  },
});

export const getCallParticipants = query({
  args: { callId: v.id("videoCalls") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("videoCallParticipants")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const participantsWithProfiles = await Promise.all(
      participants.map(async (participant) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", participant.userId))
          .unique();
        
        const user = await ctx.db.get(participant.userId);
        
        return {
          ...participant,
          name: profile?.displayName || user?.email || "Unknown",
          profileImage: profile?.profileImage,
        };
      })
    );

    return participantsWithProfiles;
  },
});
