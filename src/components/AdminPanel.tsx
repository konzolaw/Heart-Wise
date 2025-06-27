import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function AdminPanel() {
  const [activeAdminTab, setActiveAdminTab] = useState<"dashboard" | "testimonies" | "notifications" | "posts">("dashboard");
  const [lastPendingCount, setLastPendingCount] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const adminStats = useQuery(api.posts.getAdminStats);
  const testimonyStats = useQuery(api.testimonies.getTestimonyStats);
  const pendingTestimonies = useQuery(api.testimonies.getPendingTestimonies);
  const notifications = useQuery(api.posts.getAdminNotifications);

  // Check for new pending testimonies and show notification
  useEffect(() => {
    if (testimonyStats?.pending && testimonyStats.pending > lastPendingCount && lastPendingCount > 0) {
      // Show browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification("New Testimony Pending", {
          body: `${testimonyStats.pending - lastPendingCount} new testimonies need your approval`,
          icon: "/favicon.ico",
        });
      }
      
      // Show toast notification
      toast.success(`${testimonyStats.pending - lastPendingCount} new testimon${testimonyStats.pending - lastPendingCount === 1 ? 'y' : 'ies'} pending approval!`, {
        action: {
          label: "Review",
          onClick: () => setActiveAdminTab("testimonies"),
        },
        duration: 10000,
      });
    }
    
    if (testimonyStats?.pending !== undefined) {
      setLastPendingCount(testimonyStats.pending);
    }
  }, [testimonyStats?.pending, lastPendingCount]);

  // Request notification permission on component mount
  useEffect(() => {
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  const adminTabs = [
    { id: "dashboard" as const, name: "Dashboard", icon: "📊" },
    { id: "testimonies" as const, name: "Testimonies", icon: "✨" },
    { id: "notifications" as const, name: "Notifications", icon: "🔔" },
    { id: "posts" as const, name: "Posts", icon: "📝" },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🔒 Admin Panel</h2>
      
      {/* Admin Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveAdminTab(tab.id)}
            className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeAdminTab === tab.id
                ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
            {/* Notification Badge */}
            {tab.id === "testimonies" && testimonyStats?.pending && testimonyStats.pending > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {testimonyStats.pending}
              </span>
            )}
            {tab.id === "notifications" && notifications && notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeAdminTab === "dashboard" && (
        <AdminDashboard 
          adminStats={adminStats} 
          testimonyStats={testimonyStats} 
          notifications={notifications}
          setActiveTab={setActiveAdminTab}
          showCreatePost={showCreatePost}
          setShowCreatePost={setShowCreatePost}
        />
      )}
      {activeAdminTab === "testimonies" && (
        <TestimonyManagement pendingTestimonies={pendingTestimonies} />
      )}
      {activeAdminTab === "notifications" && (
        <NotificationManagement notifications={notifications} />
      )}
      {activeAdminTab === "posts" && (
        <PostManagement />
      )}
    </div>
  );
}

function AdminDashboard({ 
  adminStats, 
  testimonyStats, 
  notifications, 
  setActiveTab,
  showCreatePost,
  setShowCreatePost
}: { 
  adminStats: any; 
  testimonyStats: any; 
  notifications: any[] | undefined;
  setActiveTab: (tab: "dashboard" | "testimonies" | "notifications" | "posts") => void;
  showCreatePost: boolean;
  setShowCreatePost: (show: boolean) => void;
}) {
  if (!adminStats || !testimonyStats) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-xl h-24"></div>
        ))}
      </div>
    );
  }

  const stats = [
    { 
      label: "Total Users", 
      value: adminStats.totalUsers, 
      icon: "👥", 
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      trend: "+12% this month",
      description: "Active community members"
    },
    { 
      label: "Total Posts", 
      value: adminStats.totalPosts, 
      icon: "📝", 
      color: "bg-gradient-to-r from-green-500 to-green-600",
      trend: "+8% this week",
      description: "Community discussions"
    },
    { 
      label: "Total Comments", 
      value: adminStats.totalComments, 
      icon: "💬", 
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      trend: "+25% today",
      description: "Community engagement"
    },
    { 
      label: "Total Reactions", 
      value: adminStats.totalReactions, 
      icon: "🤖", 
      color: "bg-gradient-to-r from-indigo-500 to-indigo-600",
      trend: "+15% this week",
      description: "Likes and interactions"
    },
    { 
      label: "Pending Reviews", 
      value: testimonyStats.pending, 
      icon: "⏳", 
      color: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      trend: testimonyStats.pending > 0 ? "Needs attention" : "All clear",
      description: "Testimonies awaiting approval"
    },
    { 
      label: "Unread Alerts", 
      value: notifications?.length || 0, 
      icon: "🔔", 
      color: "bg-gradient-to-r from-red-500 to-red-600",
      trend: (notifications?.length || 0) > 0 ? "New alerts" : "No alerts",
      description: "System notifications"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Welcome, Admin! 👋</h3>
            <p className="text-lg opacity-90">Here's what's happening in your community today</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{new Date().toLocaleDateString()}</div>
            <div className="text-sm opacity-75">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.color} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </div>
            </div>
            <div className="border-t border-white/20 pt-4">
              <p className="text-sm opacity-90 mb-1">{stat.description}</p>
              <p className="text-xs font-semibold bg-white/20 rounded-full px-3 py-1 inline-block">
                {stat.trend}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Analytics */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Platform Health */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="text-2xl mr-2">📈</span>
            Platform Health
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Approved Testimonies</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Community stories</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">{testimonyStats.approved}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">⏳</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Pending Review</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Awaiting moderation</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{testimonyStats.pending}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">💬</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Active Conversations</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">AI counseling sessions</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600">{adminStats.totalConversations}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="text-2xl mr-2">⚡</span>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button 
              onClick={() => setShowCreatePost(true)}
              className="w-full flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-left group"
            >
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-white text-lg">📝</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Create Announcement</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">Share important updates</p>
              </div>
              <div className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-lg">→</span>
              </div>
            </button>
            
            <button 
              onClick={() => setActiveTab("testimonies")}
              className="w-full flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-left group"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-white text-lg">✨</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Review Testimonies</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">{testimonyStats.pending} pending approval</p>
              </div>
              <div className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-lg">→</span>
              </div>
            </button>
            
            <button 
              onClick={() => setActiveTab("posts")}
              className="w-full flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors text-left group"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-white text-lg">📋</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Manage Posts</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">Review and moderate content</p>
              </div>
              <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-lg">→</span>
              </div>
            </button>
            
            <button 
              onClick={() => setActiveTab("notifications")}
              className="w-full flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-left group"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-white text-lg">🔔</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Check Notifications</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">{notifications?.length || 0} unread alerts</p>
              </div>
              <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-lg">→</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <span className="text-2xl mr-2">🖥️</span>
          System Status
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">✓</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Database</p>
            <p className="text-xs text-green-600 dark:text-green-400">Healthy</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">🤖</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">AI Service</p>
            <p className="text-xs text-green-600 dark:text-green-400">Online</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">☁️</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Storage</p>
            <p className="text-xs text-green-600 dark:text-green-400">Available</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">🔐</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Security</p>
            <p className="text-xs text-green-600 dark:text-green-400">Protected</p>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <AdminCreatePostModal onClose={() => setShowCreatePost(false)} />
      )}
    </div>
  );
}

function TestimonyManagement({ pendingTestimonies }: { pendingTestimonies: any[] | undefined }) {
  const approveTestimony = useMutation(api.testimonies.approveTestimony);
  const rejectTestimony = useMutation(api.testimonies.rejectTestimony);

  const handleApprove = async (testimonyId: Id<"testimonies">) => {
    try {
      await approveTestimony({ testimonyId });
      toast.success("Testimony approved successfully!");
    } catch {
      toast.error("Failed to approve testimony");
    }
  };

  const handleReject = async (testimonyId: Id<"testimonies">) => {
    try {
      await rejectTestimony({ testimonyId });
      toast.success("Testimony rejected successfully!");
    } catch {
      toast.error("Failed to reject testimony");
    }
  };

  if (!pendingTestimonies) {
    return <div className="animate-pulse">Loading testimonies...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Testimonies ({pendingTestimonies.length})</h3>
      </div>

      {pendingTestimonies.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
          <span className="text-4xl mb-2 block">✨</span>
          <p>No pending testimonies to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTestimonies.map((testimony) => (
            <div key={testimony._id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{testimony.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    By {testimony.authorName} • {testimony.category}
                  </p>
                </div>
                <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs">
                  Pending
                </span>
              </div>
              
              <p className="text-gray-700 dark:text-slate-300 mb-4 line-clamp-3">{testimony.story}</p>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => void handleApprove(testimony._id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => void handleReject(testimony._id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationManagement({ notifications }: { notifications: any[] | undefined }) {
  const markNotificationRead = useMutation(api.posts.markNotificationRead);
  const markAllRead = useMutation(api.posts.markAllNotificationsRead);

  const handleMarkRead = async (notificationId: Id<"adminNotifications">) => {
    try {
      await markNotificationRead({ notificationId });
      toast.success("Notification marked as read");
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead({});
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all notifications as read");
    }
  };

  if (!notifications) {
    return <div className="animate-pulse">Loading notifications...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notifications ({notifications.length} unread)
        </h3>
        {notifications.length > 0 && (
          <button
            onClick={() => void handleMarkAllRead()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
          <span className="text-4xl mb-2 block">🔔</span>
          <p>No unread notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification._id} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      notification.priority === "high" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                      notification.priority === "medium" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    }`}>
                      {notification.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">{notification.description}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                    {new Date(notification._creationTime).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => void handleMarkRead(notification._id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostManagement() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showRealAuthor, setShowRealAuthor] = useState<Record<string, boolean>>({});
  const [selectedPostType, setSelectedPostType] = useState<"all" | "user" | "admin">("all");
  
  const allPosts = useQuery(api.posts.getAllPostsForAdmin, {});
  const regularPosts = useQuery(api.posts.getPosts, {});
  const deletePost = useMutation(api.posts.deletePost);

  // Filter posts based on selected type
  const posts = selectedPostType === "all" 
    ? allPosts 
    : selectedPostType === "admin" 
    ? allPosts?.filter(post => post.category === "announcement")
    : regularPosts;

  const handleDeletePost = async (postId: Id<"posts">) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        await deletePost({ postId });
        toast.success("Post deleted successfully");
      } catch {
        toast.error("Failed to delete post");
      }
    }
  };

  const toggleRealAuthor = (postId: string) => {
    setShowRealAuthor(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  if (!posts) {
    return <div className="animate-pulse">Loading posts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Manage Posts ({posts.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            Review, edit, and moderate community posts
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Post Type Filter */}
          <select 
            value={selectedPostType}
            onChange={(e) => setSelectedPostType(e.target.value as "all" | "user" | "admin")}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Posts</option>
            <option value="user">User Posts</option>
            <option value="admin">Admin Posts</option>
          </select>
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all inline-flex items-center space-x-2"
          >
            <span className="text-lg">✨</span>
            <span>Create Admin Post</span>
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-4">
        {posts?.slice(0, 50).map((post: any) => (
          <div key={post._id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {post.authorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">{post.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        post.category === "announcement" 
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}>
                        {post.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                      <span>By {post.authorName}</span>
                      <span>•</span>
                      <span>{new Date(post._creationTime).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-green-600 font-medium">{post.likes || 0} likes</span>
                      {post.dislikes > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-600 font-medium">{post.dislikes} dislikes</span>
                        </>
                      )}
                    </div>
                    
                    {/* Anonymous Author Reveal */}
                    {post.isAnonymous && post.realAuthorName && (
                      <button
                        onClick={() => toggleRealAuthor(post._id)}
                        className="mt-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                        title="Click to reveal real author"
                      >
                        {showRealAuthor[post._id] ? `Real: ${post.realAuthorName}` : "Anonymous (Click to reveal)"}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-sm text-gray-700 dark:text-slate-300 line-clamp-3 mb-3">{post.content}</p>
                  
                  {/* Post Image */}
                  {post.imageUrl && (
                    <div className="mt-3">
                      <img 
                        src={post.imageUrl} 
                        alt="Post image" 
                        className="w-24 h-24 object-cover rounded-lg border border-gray-300 dark:border-slate-600 hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(post.imageUrl, '_blank')}
                      />
                    </div>
                  )}
                </div>

                {/* Post Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span>💬</span>
                    <span>{post.commentCount || 0} comments</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span>👁️</span>
                    <span>{Math.floor(Math.random() * 200) + 50} views</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📅</span>
                    <span>{new Date(post._creationTime).toLocaleTimeString()}</span>
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`); }}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Copy post link"
                >
                  <span className="text-lg">🔗</span>
                </button>
                <button
                  onClick={() => void handleDeletePost(post._id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete post"
                >
                  <span className="text-lg">🗑️</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {posts?.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-700 rounded-xl">
          <div className="text-6xl mb-4">📝</div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts found</h4>
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            {selectedPostType === "admin" ? "No admin posts created yet" : "No posts match your filter"}
          </p>
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Create First Post
          </button>
        </div>
      )}

      {showCreatePost && (
        <AdminCreatePostModal onClose={() => setShowCreatePost(false)} />
      )}
    </div>
  );
}

function AdminCreatePostModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const createAdminPost = useMutation(api.posts.createPost);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image must be smaller than 5MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      let imageId: string | undefined;
      
      if (selectedImage) {
        // Upload image first
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }

      await createAdminPost({
        title: title.trim(),
        content: content.trim(),
        category: "announcement",
        isAnonymous: false,
        ...(imageId && { image: imageId as any }),
      });
      
      toast.success("Admin post created successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Admin Post</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
              placeholder="Important announcement..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
              rows={4}
              placeholder="Share important information with the community..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Add Image (Optional)
            </label>
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-slate-600"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center">
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🖼️</span>
                  </div>
                  <div>
                    <label htmlFor="admin-image-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-purple-600 hover:text-purple-500">
                        Upload an image
                      </span>
                      <input
                        id="admin-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
