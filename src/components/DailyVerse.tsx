import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function DailyVerse() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  
  const verse = useQuery(api.dailyVerse.getAIGeneratedVerse, { refreshKey });
  const generateNewVerse = useMutation(api.dailyVerse.generateNewVerse);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      setLastUpdate(new Date().toLocaleTimeString());
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Refresh on page load/component mount
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Generate verse if none exists for current minute
  useEffect(() => {
    if (verse === null) {
      // No verse exists for current minute, generate one
      const performGeneration = async () => {
        try {
          await generateNewVerse({});
          setRefreshKey(prev => prev + 1);
        } catch (error) {
          console.error("Failed to auto-generate verse:", error);
        }
      };
      void performGeneration();
    }
  }, [verse, generateNewVerse]);

  const handleManualRefresh = async () => {
    try {
      await generateNewVerse({});
      setRefreshKey(prev => prev + 1);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to generate new verse:", error);
    }
  };

  if (!verse) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 bg-purple-200 dark:bg-purple-700 rounded w-32"></div>
            <div className="h-4 bg-purple-200 dark:bg-purple-700 rounded w-16"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded mb-3"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded mb-3"></div>
          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
          📖 Daily Bread
          {verse.isAIGenerated && (
            <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
              Enjoy
            </span>
          )}
        </h3>
        <button
          onClick={() => void handleManualRefresh()}
          className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800 rounded-lg transition-colors"
          title="Get new verse"
        >
          🔄
        </button>
      </div>
      
      <blockquote className="text-lg text-gray-800 dark:text-slate-200 italic mb-4 leading-relaxed font-medium">
        "{verse.verse}"
      </blockquote>
      
      <p className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-4 text-center">
        — {verse.reference}
      </p>
      
      <div className="border-t border-purple-200 dark:border-purple-700 pt-4">
        <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
          💝 {verse.reflection}
        </p>
      </div>
      
      <div className="flex items-center justify-between mt-4 text-xs text-purple-600 dark:text-purple-400">
        <span>Topic: {verse.topic || 'Love & Relationships'}</span>
        <span>Updated: {lastUpdate}</span>
      </div>
    </div>
  );
}
