import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function AdminPanel() {
  const [activeAdminTab, setActiveAdminTab] = useState<"dashboard" | "testimonies" | "notifications" | "posts">("dashboard");

  const adminStats = useQuery(api.posts.getAdminStats);
  const testimonyStats = useQuery(api.testimonies.getTestimonyStats);
  const pendingTestimonies = useQuery(api.testimonies.getPendingTestimonies);
  const notifications = useQuery(api.posts.getAdminNotifications);

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
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeAdminTab === tab.id
                ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeAdminTab === "dashboard" && (
        <AdminDashboard adminStats={adminStats} testimonyStats={testimonyStats} />
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

function AdminDashboard({ adminStats, testimonyStats }: { adminStats: any; testimonyStats: any }) {
  if (!adminStats || !testimonyStats) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  const stats = [
    { label: "Total Users", value: adminStats.totalUsers, icon: "👥", color: "bg-blue-500" },
    { label: "Total Posts", value: adminStats.totalPosts, icon: "📝", color: "bg-green-500" },
    { label: "AI Messages", value: adminStats.totalMessages, icon: "💬", color: "bg-purple-500" },
    { label: "Conversations", value: adminStats.totalConversations, icon: "🤖", color: "bg-indigo-500" },
    { label: "Pending Testimonies", value: testimonyStats.pending, icon: "⏳", color: "bg-yellow-500" },
    { label: "Unread Alerts", value: adminStats.unreadNotifications, icon: "🔔", color: "bg-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.color} text-white rounded-xl p-4 shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📈 Platform Health</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-slate-400">Approved Testimonies</span>
            <span className="font-semibold text-green-600">{testimonyStats.approved}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-slate-400">Pending Review</span>
            <span className="font-semibold text-yellow-600">{testimonyStats.pending}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-slate-400">Active Conversations</span>
            <span className="font-semibold text-blue-600">{adminStats.totalConversations}</span>
          </div>
        </div>
      </div>
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
  const posts = useQuery(api.posts.getPosts, {});
  const deletePost = useMutation(api.posts.deletePost);

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

  if (!posts) {
    return <div className="animate-pulse">Loading posts...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Recent Posts ({posts.length})
      </h3>

      <div className="space-y-3">
        {posts.slice(0, 10).map((post) => (
          <div key={post._id} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">{post.title}</h4>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                  By {post.authorName} • {post.category} • {post.likes} likes
                </p>
                <p className="text-sm text-gray-700 dark:text-slate-300 mt-2 line-clamp-2">{post.content}</p>
              </div>
              <button
                onClick={() => void handleDeletePost(post._id)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ml-4"
                title="Delete post"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
