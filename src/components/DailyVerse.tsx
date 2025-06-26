import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function DailyVerse() {
  const verse = useQuery(api.dailyVerse.getTodaysVerse);

  if (!verse) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded mb-1"></div>
        <div className="h-3 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3">Daily Verse</h3>
      <blockquote className="text-sm text-gray-700 dark:text-slate-300 italic mb-2">
        "{verse.verse}"
      </blockquote>
      <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-3">
        {verse.reference}
      </p>
      <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
        {verse.reflection}
      </p>
    </div>
  );
}
