import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getPosts = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
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
    
    // Get user profiles, like counts, and user reactions
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", post.userId))
          .unique();

        const user = await ctx.db.get(post.userId);
        
        // Get image URL if present
        let imageUrl = post.imageUrl || null;
        if (post.image) {
          imageUrl = await ctx.storage.getUrl(post.image);
        }

        // Get user's reaction if logged in
        let userReaction = null;
        if (userId) {
          const reaction = await ctx.db
            .query("postReactions")
            .withIndex("by_user_post", (q) => q.eq("userId", userId).eq("postId", post._id))
            .unique();
          userReaction = reaction?.reaction || null;
        }

        // Get comment count
        const commentCount = await ctx.db
          .query("postComments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect()
          .then(comments => comments.length);
        
        return {
          ...post,
          authorName: post.isAnonymous ? "Anonymous" : (profile?.displayName || user?.name || user?.email || "Unknown"),
          authorImage: post.isAnonymous ? null : profile?.profileImage,
          authorBio: post.isAnonymous ? null : profile?.bio,
          imageUrl,
          userReaction,
          commentCount,
          dislikes: post.dislikes || 0,
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
      v.literal("encouragement"),
      v.literal("announcement")
    ),
    isAnonymous: v.boolean(),
    image: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const postData: any = {
      userId,
      title: args.title,
      content: args.content,
      category: args.category,
      isAnonymous: args.isAnonymous,
      realAuthorId: userId,
      likes: 0,
      dislikes: 0,
    };

    // Add image fields if provided
    if (args.image) {
      postData.image = args.image;
    }
    if (args.imageUrl) {
      postData.imageUrl = args.imageUrl;
    }

    const postId = await ctx.db.insert("posts", postData);

    return postId;
  },
});

export const toggleReaction = mutation({
  args: {
    postId: v.id("posts"),
    reaction: v.union(v.literal("like"), v.literal("dislike")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    // Check if user already has a reaction
    const existingReaction = await ctx.db
      .query("postReactions")
      .withIndex("by_user_post", (q) => q.eq("userId", userId).eq("postId", args.postId))
      .unique();

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (existingReaction) {
      if (existingReaction.reaction === args.reaction) {
        // Remove reaction if clicking the same one
        await ctx.db.delete(existingReaction._id);
        
        // Update post counts
        if (args.reaction === "like") {
          await ctx.db.patch(args.postId, { likes: Math.max(0, post.likes - 1) });
        } else {
          await ctx.db.patch(args.postId, { dislikes: Math.max(0, (post.dislikes || 0) - 1) });
        }
      } else {
        // Change reaction
        await ctx.db.patch(existingReaction._id, { reaction: args.reaction });
        
        // Update post counts
        if (args.reaction === "like") {
          await ctx.db.patch(args.postId, { 
            likes: post.likes + 1,
            dislikes: Math.max(0, (post.dislikes || 0) - 1)
          });
        } else {
          await ctx.db.patch(args.postId, { 
            likes: Math.max(0, post.likes - 1),
            dislikes: (post.dislikes || 0) + 1
          });
        }
      }
    } else {
      // Add new reaction
      await ctx.db.insert("postReactions", {
        userId,
        postId: args.postId,
        reaction: args.reaction,
      });
      
      // Update post counts
      if (args.reaction === "like") {
        await ctx.db.patch(args.postId, { likes: post.likes + 1 });
      } else {
        await ctx.db.patch(args.postId, { dislikes: (post.dislikes || 0) + 1 });
      }
    }
  },
});

export const getPostComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("postComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc")
      .collect();

    // Get user details for each comment
    const commentsWithDetails = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", comment.userId))
          .unique();

        return {
          ...comment,
          authorName: comment.isAnonymous ? "Anonymous" : (profile?.displayName || user?.name || "Unknown"),
          authorImage: comment.isAnonymous ? null : profile?.profileImage,
        };
      })
    );

    return commentsWithDetails;
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    isAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    if (!args.content.trim()) throw new Error("Comment cannot be empty");

    return await ctx.db.insert("postComments", {
      postId: args.postId,
      userId,
      content: args.content.trim(),
      isAnonymous: args.isAnonymous || false,
    });
  },
});

export const seedPosts = mutation({
  args: {},
  handler: async (ctx) => {
    // Create dummy user for Iyke if not exists
    let iykeUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "iyke@heartwise.com"))
      .unique();

    if (!iykeUser) {
      const iykeUserId = await ctx.db.insert("users", {
        email: "iyke@heartwise.com",
        name: "Iyke",
        isAnonymous: false,
      });
      iykeUser = await ctx.db.get(iykeUserId);
    }

    if (!iykeUser) return "Failed to create user";

    // Create profile for Iyke
    const iykeProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", iykeUser._id))
      .unique();

    if (!iykeProfile) {
      await ctx.db.insert("profiles", {
        userId: iykeUser._id,
        displayName: "Iyke",
        bio: "Christian relationship counselor and dating coach passionate about helping singles navigate love God's way 💕✨",
        isPrivate: false,
      });
    }

    // Delete existing posts by Iyke to refresh
    const existingPosts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", iykeUser._id))
      .collect();
    
    for (const post of existingPosts) {
      // Delete related reactions and comments first
      const reactions = await ctx.db
        .query("postReactions")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();
      for (const reaction of reactions) {
        await ctx.db.delete(reaction._id);
      }
      
      const comments = await ctx.db
        .query("postComments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }
      
      await ctx.db.delete(post._id);
    }

    const inspirationalPosts = [
      {
        title: "🌟 God's Perfect Timing in Love",
        content: "Hey beautiful souls! 💕 I want to remind you today that God's timing is absolutely perfect, especially when it comes to love.\n\nI know waiting can be hard. I see so many of you asking 'When will it be my turn?' Trust me, I've been there too. But here's what I've learned after years of counseling couples:\n\n✨ God isn't withholding love from you - He's preparing you for it\n✨ Every day of singleness is a gift to grow closer to Him\n✨ The right person is worth the wait\n\n'For I know the plans I have for you,' declares the Lord, 'plans to prosper you and not to harm you, to give you hope and a future.' - Jeremiah 29:11\n\nWhat's one thing God is teaching you in this season? Share below! 👇\n\n#GodsTimimg #ChristianSingles #Faith",
        category: "advice" as const,
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&crop=center",
      },
      {
        title: "💪 Building Character Before Courtship",
        content: "Let's talk about something CRUCIAL - becoming the person you want to attract! 🔥\n\nI see too many people focused on finding 'the one' instead of becoming 'the one' for someone else. Character is like a magnet - it attracts quality people!\n\nHere's my challenge for you this week:\n\n📖 Daily Bible study (even 10 minutes!)\n🙏 Pray for your future spouse\n💕 Practice kindness with everyone\n🎯 Work on your goals and dreams\n✨ Serve others without expecting anything back\n\n'Above all else, guard your heart, for everything you do flows from it.' - Proverbs 4:23\n\nTag someone who inspires you to be better! Let's build each other up! 💪\n\n#CharacterMatters #ChristianGrowth #BeTheOne",
        category: "advice" as const,
        imageUrl: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600&h=400&fit=crop&crop=center",
      },
      {
        title: "🤔 How Do You Know If Someone Is 'The One'?",
        content: "This is THE question I get asked most! 😅 Young people slide into my DMs asking this constantly.\n\nHere's my biblical framework for discernment:\n\n1️⃣ **The God Test**: Do they draw you closer to Jesus? \n2️⃣ **The Peace Test**: Do you have genuine peace when you pray about them?\n3️⃣ **The Values Test**: Are your core beliefs aligned?\n4️⃣ **The Vision Test**: Can you see yourselves serving God together?\n5️⃣ **The Community Test**: Do godly mentors approve?\n6️⃣ **The Growth Test**: Do you both challenge each other to grow?\n\nRemember: Marriage isn't just romance - it's a MINISTRY PARTNERSHIP! 🤝\n\nWhat would you add to this list? Drop your thoughts below! 👇\n\n#TheOne #BiblicalDating #Relationships",
        category: "question" as const,
        imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop&crop=center",
      },
      {
        title: "✨ Testimony Tuesday: Emma & Michael's Love Story",
        content: "Y'all, I'm literally crying happy tears writing this! 😭💕\n\nLet me tell you about Emma and Michael - a couple I had the privilege of mentoring last year.\n\nEmma came to me heartbroken after a toxic relationship. She was convinced she'd never find love again. Michael was a godly man who felt 'behind' because all his friends were married.\n\nThey met at our church's volunteer day! 🏠 Started as friends helping at the food bank. For 8 months, they built the most beautiful friendship I've ever seen.\n\nWhen they started dating, they:\n✅ Set clear physical boundaries\n✅ Involved their families\n✅ Prayed together regularly\n✅ Served together weekly\n\nLast Sunday, Michael proposed during worship! 💍 The whole church erupted in praise!\n\n'He who finds a wife finds a good thing and obtains favor from the Lord.' - Proverbs 18:22\n\nGod is writing your story too! Don't give up! 🙌\n\n#TestimonyTuesday #GodIsGood #LoveWins",
        category: "testimony" as const,
        imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop&crop=center",
      },
      {
        title: "💕 Monday Motivation: You Are DEEPLY Loved!",
        content: "Monday motivation coming at you HOT! 🔥\n\nI need you to hear this today: YOU ARE DEEPLY, UNCONDITIONALLY, COMPLETELY LOVED BY GOD! ❤️\n\nIt doesn't matter if you're:\n💔 Healing from heartbreak\n🤷‍♀️ Single and sometimes lonely\n😰 Anxious about your future\n💕 In a relationship but struggling\n💍 Preparing for marriage\n\nHis love for you NEVER changes! You don't need a relationship to complete you - you're already WHOLE in Christ! ✨\n\nSay this with me: 'I am loved, I am chosen, I am enough!' 📣\n\n'See what great love the Father has lavished on us, that we should be called children of God!' - 1 John 3:1\n\nDrop a ❤️ if you needed this reminder today! Let's flood the comments with love!\n\n#MondayMotivation #YouAreLoved #ChristianSingles",
        category: "encouragement" as const,
        imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop&crop=center",
      },
      {
        title: "📢 EXCITING Announcement: Biblical Dating Workshop!",
        content: "GUYS!! I'm SO excited to share this with you! 🎉\n\nBy popular demand, we're launching 'Biblical Dating in the Digital Age' - a 4-week intensive workshop! 📱📖\n\n**What we'll cover:**\n🗓️ Week 1: Setting Godly Standards (July 5th)\n💻 Week 2: Online Dating as a Christian (July 12th) \n💬 Week 3: Healthy Communication & Boundaries (July 19th)\n💒 Week 4: Preparing Your Heart for Marriage (July 26th)\n\n**Format:** Interactive sessions with Q&A, real scenarios, and practical tools!\n**Time:** Saturdays 7-9 PM EST\n**Platform:** Zoom + private Facebook group\n**Investment:** $47 (scholarships available!)\n\nEarly bird special: First 20 people get it for $27! 🎯\n\nComment 'YES!' if you're interested! Spots are filling up FAST! \n\nCan't wait to pour into you all! 💕\n\n#BiblicalDating #Workshop #ChristianSingles #LevelUp",
        category: "announcement" as const,
        imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&h=400&fit=crop&crop=center",
      },
      {
        title: "🔥 Thursday Thoughts: Red Flags vs Green Flags",
        content: "Thursday truth bomb! 💣 Let's talk about RED FLAGS vs GREEN FLAGS in dating!\n\n🚩 **RED FLAGS** (RUN!):\n- Doesn't respect your boundaries\n- Tries to rush physical intimacy\n- Critical of your faith/church\n- Secretive about their life\n- Doesn't have godly friends\n- Makes you feel 'less than'\n\n✅ **GREEN FLAGS** (GREAT!):\n- Respects your 'no' the first time\n- Encourages your relationship with God\n- Has a good relationship with family\n- Financially responsible\n- Speaks kindly about exes\n- Your friends/family love them\n\nHere's the thing: Don't ignore red flags hoping they'll change! Believe people when they show you who they are! 💯\n\n'Above all else, guard your heart, for everything you do flows from it.' - Proverbs 4:23\n\nWhat green flag means the most to you? Share below! 👇\n\n#RedFlags #GreenFlags #DatingWisdom #Standards",
        category: "advice" as const,
        imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=400&fit=crop&crop=center",
      },
      {
        title: "💝 Friendship Friday: The Foundation of Love",
        content: "Happy Friendship Friday, family! 🌟\n\nCan we talk about something that's been on my heart? The POWER of friendship in relationships! 👫\n\nI've noticed that the strongest marriages I counsel all have one thing in common - they genuinely LIKE each other! Not just love, but LIKE! 😍\n\nHere's why friendship matters:\n✨ Friends communicate openly\n✨ Friends enjoy each other's company\n✨ Friends support each other's dreams\n✨ Friends laugh together daily\n✨ Friends choose each other every day\n\nIf you're dating: Ask yourself, 'Is this person my friend?'\nIf you're single: Work on being the kind of friend you'd want to marry!\n\n'A friend loves at all times.' - Proverbs 17:17\n\nTell me: What makes someone a great friend to you? 💭\n\n#FriendshipFirst #MarriageGoals #ChristianDating",
        category: "encouragement" as const,
        imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop&crop=center",
      }
    ];

    // Insert the new posts with images
    for (const post of inspirationalPosts) {
      await ctx.db.insert("posts", {
        userId: iykeUser._id,
        realAuthorId: iykeUser._id,
        title: post.title,
        content: post.content,
        category: post.category,
        isAnonymous: false,
        likes: Math.floor(Math.random() * 150) + 25,
        dislikes: Math.floor(Math.random() * 8) + 1,
        imageUrl: post.imageUrl,
      });
    }

    return "Posts seeded successfully with images!";
  },
});

// Add sample comments and reactions to posts
export const seedPostInteractions = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all posts
    const posts = await ctx.db.query("posts").collect();
    if (posts.length === 0) return "No posts found";

    // Create sample users for interactions
    const sampleUsers = [
      { email: "sarah.m@example.com", name: "Sarah M." },
      { email: "michael.k@example.com", name: "Michael K." },
      { email: "grace.t@example.com", name: "Grace T." },
      { email: "david.w@example.com", name: "David W." },
      { email: "faith.l@example.com", name: "Faith L." },
      { email: "joshua.p@example.com", name: "Joshua P." },
      { email: "rebecca.s@example.com", name: "Rebecca S." },
      { email: "caleb.r@example.com", name: "Caleb R." },
    ];

    const userIds = [];
    for (const userData of sampleUsers) {
      let user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), userData.email))
        .unique();

      if (!user) {
        const userId = await ctx.db.insert("users", {
          email: userData.email,
          name: userData.name,
          isAnonymous: false,
        });
        user = await ctx.db.get(userId);
      }

      if (user) {
        userIds.push(user._id);
        
        // Create profile if doesn't exist
        const existingProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique();
        
        if (!existingProfile) {
          await ctx.db.insert("profiles", {
            userId: user._id,
            displayName: userData.name,
            bio: "Member of the HeartWise community",
            isPrivate: false,
          });
        }
      }
    }

    // Sample comments
    const sampleComments = [
      "Thank you for this inspiring post! This really speaks to my heart. 🙏",
      "Amen! God's timing is always perfect. I needed to hear this today.",
      "This is so encouraging! I've been struggling with waiting, but this gives me hope.",
      "Such wise words! Thank you for sharing your heart with us.",
      "This post made me cry happy tears! God is so good! 😭✨",
      "I love how you explain biblical principles in such a relatable way!",
      "This is exactly what I needed to read today. God's timing is perfect!",
      "Your posts always encourage me to trust God more. Thank you!",
      "I'm sharing this with my single friends! Such good wisdom here.",
      "This blessed my heart so much! Thank you for being obedient to God's call.",
    ];

    // Add interactions to posts
    for (let i = 0; i < Math.min(5, posts.length); i++) {
      const post = posts[i];
      
      // Add 3-7 random reactions per post
      const numReactions = Math.floor(Math.random() * 5) + 3;
      const shuffledUsers = [...userIds].sort(() => Math.random() - 0.5);
      
      for (let j = 0; j < Math.min(numReactions, shuffledUsers.length); j++) {
        const userId = shuffledUsers[j];
        const reaction = Math.random() > 0.8 ? "dislike" : "like"; // 80% likes, 20% dislikes
        
        // Check if reaction already exists
        const existingReaction = await ctx.db
          .query("postReactions")
          .withIndex("by_user_post", (q) => q.eq("userId", userId).eq("postId", post._id))
          .unique();
        
        if (!existingReaction) {
          await ctx.db.insert("postReactions", {
            userId,
            postId: post._id,
            reaction,
          });
        }
      }
      
      // Add 2-5 random comments per post
      const numComments = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < numComments; j++) {
        const userId = shuffledUsers[j % shuffledUsers.length];
        const comment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        
        await ctx.db.insert("postComments", {
          postId: post._id,
          userId,
          content: comment,
          isAnonymous: false,
        });
      }
    }

    return "Post interactions seeded successfully!";
  },
});

// Admin Statistics
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const totalPosts = await ctx.db.query("posts").collect().then(posts => posts.length);
    const totalUsers = await ctx.db.query("users").collect().then(users => users.length);
    const totalComments = await ctx.db.query("postComments").collect().then(comments => comments.length);
    const totalReactions = await ctx.db.query("postReactions").collect().then(reactions => reactions.length);
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentPosts = await ctx.db.query("posts")
      .filter((q) => q.gte(q.field("_creationTime"), sevenDaysAgo))
      .collect().then(posts => posts.length);
    
    const recentComments = await ctx.db.query("postComments")
      .filter((q) => q.gte(q.field("_creationTime"), sevenDaysAgo))
      .collect().then(comments => comments.length);

    return {
      totalPosts,
      totalUsers,
      totalComments,
      totalReactions,
      recentPosts,
      recentComments,
    };
  },
});

// Admin Notifications
export const getAdminNotifications = query({
  args: {},
  handler: async (_ctx) => {
    // For now, return empty array since we don't have adminNotifications table in current schema
    // This can be expanded later when the table is added
    return [];
  },
});

// Mark notification as read (admin only)
export const markNotificationRead = mutation({
  args: { notificationId: v.id("adminNotifications") },
  handler: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.email !== "admin@heartwise.com") {
      throw new Error("Admin access required");
    }

    // For now, since we don't have adminNotifications table, return success
    // This can be implemented when the table is added to schema
    return "Notification marked as read";
  },
});

// Mark all notifications as read (admin only)
export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.email !== "admin@heartwise.com") {
      throw new Error("Admin access required");
    }

    // For now, since we don't have adminNotifications table, return success
    // This can be implemented when the table is added to schema
    return "All notifications marked as read";
  },
});

// Delete a post (admin only)
export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.email !== "admin@heartwise.com") {
      throw new Error("Admin access required");
    }

    // Delete related reactions first
    const reactions = await ctx.db
      .query("postReactions")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const reaction of reactions) {
      await ctx.db.delete(reaction._id);
    }

    // Delete related comments
    const comments = await ctx.db
      .query("postComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete the post
    await ctx.db.delete(args.postId);
    
    return "Post deleted successfully";
  },
});

// Get all posts for admin management
export const getAllPostsForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.email !== "admin@heartwise.com") {
      throw new Error("Admin access required");
    }

    const posts = await ctx.db.query("posts").order("desc").collect();
    
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", post.userId))
          .unique();

        const user = await ctx.db.get(post.userId);
        
        // Get image URL if present
        let imageUrl = post.imageUrl || null;
        if (post.image) {
          imageUrl = await ctx.storage.getUrl(post.image);
        }

        // Get comment count
        const commentCount = await ctx.db
          .query("postComments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect()
          .then(comments => comments.length);
        
        return {
          ...post,
          authorName: post.isAnonymous ? "Anonymous" : (profile?.displayName || user?.name || user?.email || "Unknown"),
          authorEmail: user?.email,
          imageUrl,
          commentCount,
          dislikes: post.dislikes || 0,
        };
      })
    );

    return postsWithDetails;
  },
});
