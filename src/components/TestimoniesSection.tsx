/* eslint-disable @typescript-eslint/no-misused-promises */
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function TestimoniesSection() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const testimonies = useQuery(api.testimonies.getApprovedTestimonies, {
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });

  const categories = [
    { id: "all", name: "All", icon: "✨" },
    { id: "relationship", name: "Relationship", icon: "💕" },
    { id: "marriage", name: "Marriage", icon: "💍" },
    { id: "healing", name: "Healing", icon: "🙏" },
    { id: "guidance", name: "Guidance", icon: "🧭" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Testimonies</h2>
        <button
          onClick={() => setShowSubmitForm(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          Share Testimony
        </button>
      </div>

      <p className="text-gray-600 dark:text-slate-300 mb-6">
        Read inspiring stories of how God has worked in relationships and dating journeys.
      </p>

      {/* Category Filter */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? "bg-purple-100 text-purple-700 border border-purple-300"
                : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
            }`}
          >
            <span>{category.icon}</span>
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Testimonies */}
      <div className="space-y-6">
        {testimonies?.map((testimony) => (
          <TestimonyCard key={testimony._id} testimony={testimony} />
        ))}
        
        {!testimonies?.length && (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✨</span>
            </div>
            <p className="text-lg font-medium mb-2">No testimonies yet</p>
            <p className="text-sm">Be the first to share how God has worked in your life!</p>
          </div>
        )}
      </div>

      {showSubmitForm && (
        <SubmitTestimonyModal onClose={() => setShowSubmitForm(false)} />
      )}
    </div>
  );
}

function TestimonyCard({ testimony }: { testimony: any }) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "relationship": return "bg-pink-100 text-pink-700";
      case "marriage": return "bg-purple-100 text-purple-700";
      case "healing": return "bg-green-100 text-green-700";
      case "guidance": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {testimony.authorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{testimony.authorName}</p>
            <p className="text-sm text-gray-500">
              {new Date(testimony._creationTime).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(testimony.category)}`}>
          {testimony.category}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-3">{testimony.title}</h3>
      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{testimony.story}</p>
      
      <div className="mt-4 pt-4 border-t border-purple-200">
        <p className="text-sm text-purple-600 font-medium">
          "Give thanks to the Lord, for he is good; his love endures forever." - Psalm 107:1
        </p>
      </div>
    </div>
  );
}

function SubmitTestimonyModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [category, setCategory] = useState<"relationship" | "marriage" | "healing" | "guidance">("relationship");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const submitTestimony = useMutation(api.testimonies.submitTestimony);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !story.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await submitTestimony({
        title: title.trim(),
        story: story.trim(),
        category,
        isAnonymous,
      });
      toast.success("Testimony submitted for review!");
      onClose();
    } catch (error) {
      toast.error("Failed to submit testimony");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Share Your Testimony</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Share how God has worked in your dating or relationship journey to encourage others.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
              placeholder="How God answered my prayers..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              <option value="relationship">Relationship</option>
              <option value="marriage">Marriage</option>
              <option value="healing">Healing</option>
              <option value="guidance">Guidance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Your Story
            </label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
              rows={6}
              placeholder="Share your testimony of God's faithfulness..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
            />
            <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700 dark:text-slate-300">
              Submit anonymously
            </label>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> All testimonies are reviewed before being published to ensure they align with Biblical values.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
