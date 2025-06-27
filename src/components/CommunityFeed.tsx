import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function CommunityFeed() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreatePost, setShowCreatePost] = useState(false);

  const posts = useQuery(api.posts.getPosts, { 
    category: selectedCategory === "all" ? undefined : selectedCategory 
  });

  const categories = [
    { id: "all", name: "All Posts", icon: "📝", color: "from-purple-500 to-pink-500" },
    { id: "announcement", name: "Announcements", icon: "📢", color: "from-blue-500 to-cyan-500" },
    { id: "advice", name: "Advice", icon: "💡", color: "from-green-500 to-emerald-500" },
    { id: "testimony", name: "Testimony", icon: "✨", color: "from-purple-500 to-violet-500" },
    { id: "question", name: "Question", icon: "❓", color: "from-yellow-500 to-orange-500" },
    { id: "encouragement", name: "Encouragement", icon: "💪", color: "from-pink-500 to-rose-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Community Feed</h1>
            <p className="text-xl opacity-90 mb-8">Share your heart, grow in faith, connect with purpose</p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg inline-flex items-center space-x-2"
            >
              <span className="text-xl">✨</span>
              <span>Share Your Story</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Browse by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 ${
                  selectedCategory === category.id
                    ? "scale-105 shadow-lg"
                    : "hover:scale-105 hover:shadow-md"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} ${
                  selectedCategory === category.id ? "opacity-100" : "opacity-20 group-hover:opacity-30"
                } transition-opacity`}></div>
                <div className="relative text-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className={`text-sm font-medium ${
                    selectedCategory === category.id 
                      ? "text-white" 
                      : "text-gray-700 dark:text-slate-300"
                  }`}>
                    {category.name}
                  </div>
                  {selectedCategory === category.id && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Posts Section */}
        <div className="space-y-8">
          {posts?.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <div className="text-6xl">
                  {selectedCategory === "all" ? "📝" : categories.find(c => c.id === selectedCategory)?.icon}
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {selectedCategory === "all" ? "No posts yet" : `No ${selectedCategory} posts yet`}
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                {selectedCategory === "all" 
                  ? "Be the first to share something meaningful with the community!" 
                  : `Be the first to share a ${selectedCategory} post with the community!`
                }
              </p>
              <button
                onClick={() => setShowCreatePost(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Create First Post
              </button>
            </div>
          ) : (
            <>
              {/* Posts Grid/List */}
              <div className="space-y-6">
                {posts?.map((post, index) => (
                  <div key={post._id} className={index === 0 ? "featured-post" : ""}>
                    <CommunityPostCard post={post} isFeatured={index === 0} />
                  </div>
                ))}
              </div>
              
              {/* Load More Section */}
              {posts && posts.length > 0 && (
                <div className="text-center py-12 border-t border-gray-200 dark:border-slate-700">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      You've seen all the latest posts! 🎉
                    </h4>
                    <p className="text-gray-600 dark:text-slate-400 mb-6">
                      Why not share your own story or ask a question?
                    </p>
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      Share Your Heart
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} />
      )}
    </div>
  );
}

function CommunityPostCard({ post, isFeatured = false }: { post: any; isFeatured?: boolean }) {
  const toggleReaction = useMutation(api.posts.toggleReaction);
  const addComment = useMutation(api.posts.addComment);
  const postComments = useQuery(api.posts.getPostComments, { postId: post._id });
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthorProfile, setShowAuthorProfile] = useState(false);

  const handleReaction = async (reaction: "like" | "dislike") => {
    setIsLoading(true);
    try {
      await toggleReaction({ postId: post._id, reaction });
    } catch {
      toast.error(`Failed to ${reaction} post`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    setIsLoading(true);
    try {
      await addComment({ postId: post._id, content: commentText.trim() });
      setCommentText("");
      toast.success("Comment added!");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
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
    <div className={`bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${
      isFeatured 
        ? "border-2 border-gradient-to-r from-purple-300 to-pink-300 dark:from-purple-600 dark:to-pink-600 shadow-lg" 
        : "border-gray-200"
    }`}>
      {/* Featured Badge */}
      {isFeatured && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-sm font-medium">
          <div className="flex items-center space-x-2">
            <span className="text-lg">⭐</span>
            <span>Featured Post</span>
          </div>
        </div>
      )}

      {/* Image - Full width if featured, or with padding if not */}
      {post.imageUrl && (
        <div className={`relative overflow-hidden ${isFeatured ? "h-72" : "h-64 mx-4 mt-4 rounded-xl"}`}>
          <img 
            src={post.imageUrl} 
            alt="Post image" 
            className={`w-full h-full object-cover hover:scale-105 transition-transform duration-500 ${
              !isFeatured ? "rounded-xl border border-gray-200 dark:border-slate-600" : ""
            }`}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          
          {/* Category badge on image */}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-lg ${getCategoryColor(post.category)}`}>
              {post.category}
            </span>
          </div>
          
          {/* Title overlay for featured posts */}
          {isFeatured && (
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="text-white font-bold text-2xl leading-tight mb-2">{post.title}</h3>
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-sm font-bold">{post.authorName.charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-medium">{post.authorName}</span>
                <span className="text-sm">•</span>
                <span className="text-sm">{formatTimeAgo(post._creationTime)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post Header - only show if no image or not featured */}
      {(!post.imageUrl || !isFeatured) && (
        <div className="flex items-start justify-between p-6 pb-3">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg"
              onClick={() => setShowAuthorProfile(!showAuthorProfile)}
            >
              <span className="text-white font-bold text-lg">
                {post.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p 
                className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                onClick={() => setShowAuthorProfile(!showAuthorProfile)}
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
      )}

      {/* Author Profile Popup */}
      {showAuthorProfile && (
        <div className="mx-6 mb-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-700 dark:to-slate-700 rounded-xl border border-purple-200 dark:border-slate-600">
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
      <div className="px-6 pb-4">
        {/* Title - only show if not overlaid on image */}
        {(!post.imageUrl || !isFeatured) && (
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">{post.title}</h3>
        )}
        
        {/* Content */}
        <div className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
          {post.content.split('\n').map((line: string, index: number) => (
            <p key={index} className={index > 0 ? 'mt-3' : ''}>
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-750">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
          <div className="flex items-center space-x-6">
            {post.likes > 0 && (
              <span className="flex items-center space-x-1">
                <span>❤️</span>
                <span className="font-medium">{post.likes}</span>
              </span>
            )}
            {post.dislikes > 0 && (
              <span className="flex items-center space-x-1">
                <span>👎</span>
                <span className="font-medium">{post.dislikes}</span>
              </span>
            )}
            {post.commentCount > 0 && (
              <span className="font-medium">{post.commentCount} comments</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs">{Math.floor(Math.random() * 200) + 50} views</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-around">
          <button
            onClick={() => void handleReaction("like")}
            disabled={isLoading}
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
            onClick={() => void handleReaction("dislike")}
            disabled={isLoading}
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
            onClick={() => setShowComments(!showComments)}
            className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all flex-1 mr-1"
          >
            <span className="text-lg">💬</span>
            <span className="font-medium text-sm">Comment</span>
          </button>

          <button 
            onClick={() => void handleShare()}
            className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all flex-1"
          >
            <span className="text-lg">📤</span>
            <span className="font-medium text-sm">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 dark:border-slate-700">
          {/* Add Comment */}
          <div className="p-4 bg-gray-50 dark:bg-slate-750">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">U</span>
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a thoughtful comment..."
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 text-sm resize-none"
                  rows={2}
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-500 dark:text-slate-500">
                    💕 Share your thoughts with kindness
                  </span>
                  <button
                    onClick={() => void handleAddComment()}
                    disabled={!commentText.trim() || isLoading}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isLoading ? "Posting..." : "Post"}
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

function CreatePostModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"advice" | "testimony" | "question" | "encouragement">("question");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const createPost = useMutation(api.posts.createPost);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image must be smaller than 5MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
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
      
      // Upload image if selected
      if (selectedImage) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        
        if (!result.ok) {
          throw new Error("Failed to upload image");
        }
        
        const { storageId } = await result.json();
        imageId = storageId;
      }

      await createPost({
        title: title.trim(),
        content: content.trim(),
        category,
        isAnonymous,
        ...(imageId && { image: imageId as any }),
      });
      
      toast.success("Post created successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <span className="text-2xl mr-2">✨</span>
              Create New Post
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="text-xl">×</span>
            </button>
          </div>

          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              >
                <option value="question">❓ Question</option>
                <option value="advice">💡 Advice</option>
                <option value="testimony">✨ Testimony</option>
                <option value="encouragement">💪 Encouragement</option>
              </select>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your post about?"
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                required
              />
            </div>

            {/* Content Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts, experiences, or ask for guidance..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 resize-none"
                required
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Add Image (Optional)
              </label>
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-xl border border-gray-300 dark:border-slate-600"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/50 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
                    {selectedImage?.name}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                  <div className="space-y-3">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl flex items-center justify-center">
                      <span className="text-3xl">🖼️</span>
                    </div>
                    <div>
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500">
                          Upload an image
                        </span>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Anonymous Checkbox */}
            <div className="flex items-center p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="anonymous" className="ml-3 flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Post anonymously
                </span>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Your identity will be hidden from other users
                </p>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Create Post</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
