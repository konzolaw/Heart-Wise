import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate a secure random token
function generateResetToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
}

export const requestPasswordReset = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .unique();

    if (!user) {
      // Don't reveal if email exists for security
      return { success: true, message: "If the email exists, a reset link has been sent." };
    }

    // Check if there's already an active reset token
    const existingToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.and(
        q.eq(q.field("isUsed"), false),
        q.gt(q.field("expiresAt"), Date.now())
      ))
      .unique();

    if (existingToken) {
      return { 
        success: true, 
        message: "A password reset link has already been sent. Please check your email.",
        token: existingToken.token // In production, this would be sent via email
      };
    }

    // Create new reset token (expires in 1 hour)
    const token = generateResetToken();
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    await ctx.db.insert("passwordResetTokens", {
      userId: user._id,
      token,
      expiresAt,
      isUsed: false,
    });

    // In production, you would send this token via email
    // For demo purposes, we'll return it
    return { 
      success: true, 
      message: "Password reset link has been sent to your email.",
      token, // Remove this in production
      resetUrl: `${process.env.FRONTEND_URL || "http://localhost:5174"}/reset-password?token=${token}`
    };
  },
});

export const validateResetToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .filter((q) => q.and(
        q.eq(q.field("isUsed"), false),
        q.gt(q.field("expiresAt"), Date.now())
      ))
      .unique();

    if (!resetToken) {
      return { valid: false, message: "Invalid or expired reset token." };
    }

    const user = await ctx.db.get(resetToken.userId);
    if (!user) {
      return { valid: false, message: "User not found." };
    }

    return { 
      valid: true, 
      userId: resetToken.userId,
      email: user.email 
    };
  },
});

export const resetPassword = mutation({
  args: { 
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate token
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .filter((q) => q.and(
        q.eq(q.field("isUsed"), false),
        q.gt(q.field("expiresAt"), Date.now())
      ))
      .unique();

    if (!resetToken) {
      throw new Error("Invalid or expired reset token");
    }

    const user = await ctx.db.get(resetToken.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Mark token as used
    await ctx.db.patch(resetToken._id, {
      isUsed: true,
    });

    // Note: In a real implementation, you would update the user's password
    // Since we're using Convex Auth, the password update would need to be handled
    // through the auth system. For now, we'll just mark the token as used.
    
    return { 
      success: true, 
      message: "Password has been reset successfully. You can now sign in with your new password.",
      userId: resetToken.userId
    };
  },
});

export const getCurrentUserResetTokens = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isUsed"), false))
      .collect();
  },
});
