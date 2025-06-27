import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ChatInterface } from "./ChatInterface";
import { CommunityFeed } from "./CommunityFeed";
import { TestimoniesSection } from "./TestimoniesSection";
import { DailyVerse } from "./DailyVerse";
import { AdminPanel } from "./AdminPanel";
import { LiveChatComponent } from "./LiveChatComponent";
import { VideoCallsComponent } from "./VideoCallsComponent";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

type Tab = "dashboard" | "chat" | "community" | "testimonies" | "profile" | "live-chat" | "video-calls" | "admin";

export function Dashboard({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (value: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const profile = useQuery(api.profiles.getCurrentProfile);
  const user = useQuery(api.auth.loggedInUser);
  
  const isAdmin = user?.email === "admin@heartwise.com";

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHome setActiveTab={setActiveTab} />;
      case "chat":
        return <ChatInterface />;
      case "community":
        return <CommunityFeed />;
      case "live-chat":
        return <LiveChatComponent />;
      case "video-calls":
        return <VideoCallsComponent />;
      case "testimonies":
        return <TestimoniesSection />;
      case "profile":
        return <ProfileSection profile={profile} />;
      case "admin":
        return isAdmin ? <AdminPanel /> : <div>Access denied</div>;
      default:
        return <DashboardHome setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <Navbar 
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
        currentTab={activeTab}
        setCurrentTab={(tab) => setActiveTab(tab as Tab)}
      />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </main>

      <Footer onNavigate={(tab) => setActiveTab(tab as Tab)} />
    </div>
  );
}

function DashboardHome({ setActiveTab }: { setActiveTab: (tab: Tab) => void }) {
  const posts = useQuery(api.posts.getPosts, { category: undefined });
  const postComments = useQuery(api.posts.getPostComments, posts?.[0] ? { postId: posts[0]._id } : "skip");
  const toggleReaction = useMutation(api.posts.toggleReaction);
  const addComment = useMutation(api.posts.addComment);
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [showAuthorProfile, setShowAuthorProfile] = useState<Record<string, boolean>>({});

  // Take only first 6 posts for dashboard
  const dashboardPosts = posts?.slice(0, 6) || [];

  const handleReaction = async (postId: Id<"posts">, reaction: "like" | "dislike") => {
    try {
      await toggleReaction({ postId, reaction });
    } catch {
      toast.error(`Failed to ${reaction} post`);
    }
  };

  const handleComment = async (postId: Id<"posts">) => {
    const content = commentTexts[postId]?.trim();
    if (!content) return;

    try {
      await addComment({ postId, content });
      setCommentTexts(prev => ({ ...prev, [postId]: "" }));
      toast.success("Comment added!");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleShare = async (post: any) => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + "...",
          url: postUrl,
        });
      } else {
        await navigator.clipboard.writeText(postUrl);
        toast.success("Post URL copied to clipboard!");
      }
    } catch {
      toast.error("Failed to share post");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "announcement": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200";
      case "advice": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
      case "testimony": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200";
      case "question": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200";
      case "encouragement": return "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to HeartWise 💕</h1>
        <p className="text-lg opacity-90">Your faith-based dating companion</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Daily Verse */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <span className="text-2xl mr-2">📖</span>
                Daily Verse & Reflection
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                AI-powered Biblical wisdom for your day
              </p>
            </div>
            <div className="p-6">
              <DailyVerse />
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setActiveTab("chat")}
                className="w-full flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
              >
                <span className="text-2xl">🤖</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">Ask AI Counselor</div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Get Biblical advice</div>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab("community")}
                className="w-full flex items-center space-x-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
              >
                <span className="text-2xl">👥</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">Join Community</div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Share and connect</div>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab("live-chat")}
                className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <span className="text-2xl">💬</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">Live Chat</div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Real-time discussions</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-800 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <span className="text-2xl mr-3">💝</span>
                Community Highlights
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                Latest posts from our faith-based community
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{dashboardPosts.length}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">Recent Posts</div>
              </div>
              <button 
                onClick={() => setActiveTab("community")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm flex items-center space-x-2"
              >
                <span>View All</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {dashboardPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="text-4xl">📝</div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No posts yet</h3>
              <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto">Be the first to share something meaningful with our community!</p>
              <button 
                onClick={() => setActiveTab("community")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Create Post
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Featured Post Grid */}
              {dashboardPosts.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  {dashboardPosts.slice(0, 2).map((post) => (
                    <div key={post._id} className="group">
                      <FeaturedPostCard 
                        post={post} 
                        showComments={showComments}
                        setShowComments={setShowComments}
                        commentTexts={commentTexts}
                        setCommentTexts={setCommentTexts}
                        showAuthorProfile={showAuthorProfile}
                        setShowAuthorProfile={setShowAuthorProfile}
                        handleReaction={handleReaction}
                        handleComment={handleComment}
                        handleShare={handleShare}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Regular Posts */}
              {dashboardPosts.length > 2 && (
                <div className="space-y-6">
                  <div className="flex items-center">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 dark:via-purple-600 to-transparent"></div>
                    <div className="px-4 text-sm font-medium text-gray-500 dark:text-slate-400">More Posts</div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 dark:via-purple-600 to-transparent"></div>
                  </div>
                  {dashboardPosts.slice(2, 6).map((post) => (
                    <PostCard 
                      key={post._id} 
                      post={post} 
                      showComments={showComments}
                      setShowComments={setShowComments}
                      commentTexts={commentTexts}
                      setCommentTexts={setCommentTexts}
                      showAuthorProfile={showAuthorProfile}
                      setShowAuthorProfile={setShowAuthorProfile}
                      handleReaction={handleReaction}
                      handleComment={handleComment}
                      handleShare={handleShare}
                    />
                  ))}
                </div>
              )}
              
              {/* View More Button */}
              <div className="text-center pt-8 border-t border-gray-100 dark:border-slate-700">
                <button 
                  onClick={() => setActiveTab("community")}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg inline-flex items-center space-x-3"
                >
                  <span>Explore Full Community</span>
                  <span className="text-lg">🚀</span>
                </button>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-3">
                  Join the conversation with {dashboardPosts.length > 6 ? `${dashboardPosts.length - 6} more posts` : "our amazing community"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ profile }: { profile: any }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile Settings</h2>
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Display Name</h3>
          <p className="text-gray-600 dark:text-slate-400">{profile?.displayName || "Not set"}</p>
        </div>
        
        {profile?.bio && (
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Bio</h3>
            <p className="text-gray-600 dark:text-slate-400">{profile.bio}</p>
          </div>
        )}
        
        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy</h3>
          <p className="text-gray-600 dark:text-slate-400">
            {profile?.isPrivate ? "Private profile" : "Public profile"}
          </p>
        </div>
      </div>
    </div>
  );
}

// Featured Post Card Component for featured posts in the highlight section
function FeaturedPostCard({ 
  post, 
  showComments, 
  setShowComments, 
  commentTexts, 
  setCommentTexts, 
  showAuthorProfile, 
  setShowAuthorProfile, 
  handleReaction, 
  handleComment, 
  handleShare 
}: {
  post: any;
  showComments: Record<string, boolean>;
  setShowComments: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  commentTexts: Record<string, string>;
  setCommentTexts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  showAuthorProfile: Record<string, boolean>;
  setShowAuthorProfile: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleReaction: (postId: Id<"posts">, reaction: "like" | "dislike") => Promise<void>;
  handleComment: (postId: Id<"posts">) => Promise<void>;
  handleShare: (post: any) => Promise<void>;
}) {
  const postComments = useQuery(api.posts.getPostComments, { postId: post._id });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "announcement": return "bg-blue-500 text-white";
      case "advice": return "bg-green-500 text-white";
      case "testimony": return "bg-purple-500 text-white";
      case "question": return "bg-yellow-500 text-white";
      case "encouragement": return "bg-pink-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Featured Image */}
      {post.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={post.imageUrl} 
            alt="Post image" 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-lg ${getCategoryColor(post.category)}`}>
              {post.category}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">{post.title}</h3>
          </div>
        </div>
      )}

      {/* Content for posts without images */}
      {!post.imageUrl && (
        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-start justify-between mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
              {post.category}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">{post.title}</h3>
        </div>
      )}

      {/* Post Body */}
      <div className="p-6">
        {/* Author Info */}
        <div className="flex items-center space-x-3 mb-4">
          <div 
            className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-md"
            onClick={() => setShowAuthorProfile(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
          >
            <span className="text-white font-bold text-sm">
              {post.authorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p 
              className="font-semibold text-gray-900 dark:text-white text-sm cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              onClick={() => setShowAuthorProfile(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
            >
              {post.authorName}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {formatTimeAgo(post._creationTime)}
            </p>
          </div>
        </div>

        {/* Content */}
        {post.imageUrl ? (
          <div className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed line-clamp-3">
            {post.content}
          </div>
        ) : (
          <div className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed line-clamp-4">
            {post.content}
          </div>
        )}

        {/* Engagement */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-slate-400">
            {(post.likes > 0 || post.dislikes > 0) && (
              <div className="flex items-center space-x-2">
                {post.likes > 0 && <span className="flex items-center space-x-1"><span>❤️</span><span>{post.likes}</span></span>}
                {post.dislikes > 0 && <span className="flex items-center space-x-1"><span>👎</span><span>{post.dislikes}</span></span>}
              </div>
            )}
            {post.commentCount > 0 && <span>{post.commentCount} comments</span>}
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => void handleReaction(post._id, "like")}
              className={`p-2 rounded-lg transition-all ${
                post.userReaction === "like" 
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" 
                  : "text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
              }`}
            >
              <span className="text-lg">{post.userReaction === "like" ? "❤️" : "🤍"}</span>
            </button>
            <button
              onClick={() => setShowComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
            >
              <span className="text-lg">💬</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Post Card Component for better organization
function PostCard({ 
  post, 
  showComments, 
  setShowComments, 
  commentTexts, 
  setCommentTexts, 
  showAuthorProfile, 
  setShowAuthorProfile, 
  handleReaction, 
  handleComment, 
  handleShare 
}: {
  post: any;
  showComments: Record<string, boolean>;
  setShowComments: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  commentTexts: Record<string, string>;
  setCommentTexts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  showAuthorProfile: Record<string, boolean>;
  setShowAuthorProfile: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleReaction: (postId: Id<"posts">, reaction: "like" | "dislike") => Promise<void>;
  handleComment: (postId: Id<"posts">) => Promise<void>;
  handleShare: (post: any) => Promise<void>;
}) {
  const postComments = useQuery(api.posts.getPostComments, { postId: post._id });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "announcement": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200";
      case "advice": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
      case "testimony": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200";
      case "question": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200";
      case "encouragement": return "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg"
            onClick={() => setShowAuthorProfile(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
          >
            <span className="text-white font-bold text-lg">
              {post.authorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p 
              className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              onClick={() => setShowAuthorProfile(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
            >
              {post.authorName}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {formatTimeAgo(post._creationTime)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
            {post.category}
          </span>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
            <span className="text-lg">⋯</span>
          </button>
        </div>
      </div>

      {/* Author Profile Popup */}
      {showAuthorProfile[post._id] && (
        <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-700 dark:to-slate-700 rounded-xl border border-purple-200 dark:border-slate-600">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">
                {post.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 dark:text-white text-lg">{post.authorName}</h4>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                {post.authorBio || "Christian relationship counselor and dating coach passionate about helping singles navigate love God's way 💕✨"}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">✨ Relationship Coach</span>
                <span className="text-xs text-pink-600 dark:text-pink-400 font-medium">💕 Community Leader</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Content */}
      <div className="px-4 pb-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 leading-tight">{post.title}</h3>
        <div className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
          {post.content.split('\n').map((line: string, index: number) => (
            <p key={index} className={index > 0 ? 'mt-2' : ''}>
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="px-4 pb-3">
          <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600 shadow-sm">
            <img 
              src={post.imageUrl} 
              alt="Post image" 
              className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {/* Image overlay for better readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
          <div className="flex items-center space-x-4">
            {post.likes > 0 && (
              <span className="flex items-center space-x-1">
                <span>❤️</span>
                <span>{post.likes}</span>
              </span>
            )}
            {post.dislikes > 0 && (
              <span className="flex items-center space-x-1">
                <span>👎</span>
                <span>{post.dislikes}</span>
              </span>
            )}
            {post.commentCount > 0 && (
              <span>{post.commentCount} comments</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs">{Math.floor(Math.random() * 50) + 10} views</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-around">
          <button
            onClick={() => void handleReaction(post._id, "like")}
            className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all flex-1 mr-1 ${
              post.userReaction === "like" 
                ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" 
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700"
            }`}
          >
            <span className="text-lg">{post.userReaction === "like" ? "❤️" : "🤍"}</span>
            <span className="font-medium text-sm">Like</span>
          </button>

          <button
            onClick={() => void handleReaction(post._id, "dislike")}
            className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all flex-1 mr-1 ${
              post.userReaction === "dislike" 
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700"
            }`}
          >
            <span className="text-lg">{post.userReaction === "dislike" ? "👎" : "👎🏻"}</span>
            <span className="font-medium text-sm">Dislike</span>
          </button>
          
          <button 
            onClick={() => setShowComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
            className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all flex-1 mr-1"
          >
            <span className="text-lg">💬</span>
            <span className="font-medium text-sm">Comment</span>
          </button>

          <button 
            onClick={() => void handleShare(post)}
            className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all flex-1"
          >
            <span className="text-lg">📤</span>
            <span className="font-medium text-sm">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments[post._id] && (
        <div className="border-t border-gray-100 dark:border-slate-700">
          {/* Add Comment */}
          <div className="p-4 bg-gray-50 dark:bg-slate-750">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">U</span>
              </div>
              <div className="flex-1">
                <textarea
                  value={commentTexts[post._id] || ""}
                  onChange={(e) => setCommentTexts(prev => ({ ...prev, [post._id]: e.target.value }))}
                  placeholder="Write a thoughtful comment..."
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 text-sm resize-none"
                  rows={2}
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-500 dark:text-slate-500">
                    💕 Share your thoughts with kindness
                  </span>
                  <button
                    onClick={() => void handleComment(post._id)}
                    disabled={!commentTexts[post._id]?.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Existing Comments */}
          <div className="max-h-96 overflow-y-auto">
            {postComments && postComments.length > 0 ? (
              <div className="p-4 space-y-4">
                {postComments.map((comment, index) => (
                  <div key={comment._id || index} className="flex space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {comment.authorName?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 dark:bg-slate-700 rounded-xl px-4 py-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {comment.authorName || 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            {formatTimeAgo(comment._creationTime)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-slate-300">
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 ml-2">
                        <button className="text-xs text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 font-medium">
                          Like
                        </button>
                        <button className="text-xs text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 font-medium">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-slate-400">
                <span className="text-2xl mb-2 block">💬</span>
                <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
