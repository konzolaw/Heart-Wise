import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";
import { ChatInterface } from "./ChatInterface";
import { CommunityFeed } from "./CommunityFeed";
import { TestimoniesSection } from "./TestimoniesSection";
import { DailyVerse } from "./DailyVerse";

type Tab = "chat" | "community" | "testimonies" | "profile" | "communitychat" | "admin";

export function Dashboard({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (value: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const profile = useQuery(api.profiles.getCurrentProfile);
  const user = useQuery(api.auth.loggedInUser);
  
  const isAdmin = user?.email === "admin@heartwise.com";

  const tabs = [
    { id: "chat" as Tab, name: "AI Counselor", icon: "🤖" },
    { id: "community" as Tab, name: "Community", icon: "👥" },
    { id: "communitychat" as Tab, name: "Live Chat", icon: "💬" },
    { id: "testimonies" as Tab, name: "Testimonies", icon: "✨" },
    { id: "profile" as Tab, name: "Profile", icon: "👤" },
    ...(isAdmin ? [{ id: "admin" as Tab, name: "Admin Panel", icon: "⚙️" }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">❤️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  HeartWise
                </h1>
                <p className="text-sm text-gray-600 dark:text-slate-400">Welcome back, {profile?.displayName}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-6">
              <DailyVerse />
            </div>
            
            <nav className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm min-h-[600px]">
              {activeTab === "chat" && <ChatInterface />}
              {activeTab === "community" && <CommunityFeed />}
              {activeTab === "communitychat" && <CommunityChatSection />}
              {activeTab === "testimonies" && <TestimoniesSection />}
              {activeTab === "profile" && <ProfileSettings />}
              {activeTab === "admin" && isAdmin && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🔒 Admin Panel</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-500 text-white rounded-lg p-4 text-center">
                      <h3>👥 Users</h3>
                      <p className="text-2xl font-bold">24</p>
                    </div>
                    <div className="bg-green-500 text-white rounded-lg p-4 text-center">
                      <h3>💬 Messages</h3>
                      <p className="text-2xl font-bold">156</p>
                    </div>
                    <div className="bg-red-500 text-white rounded-lg p-4 text-center">
                      <h3>🚨 Alerts</h3>
                      <p className="text-2xl font-bold">3</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityChatSection() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Community Chat</h2>
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 text-center">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">💬</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Live Community Chat</h3>
        <p className="text-gray-600 dark:text-slate-300 mb-4">
          Connect with fellow believers in real-time discussions about relationships, dating, and faith.
        </p>
        <p className="text-sm text-purple-600 dark:text-purple-400">
          Coming soon! We're working on bringing you live community chat features.
        </p>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const profile = useQuery(api.profiles.getCurrentProfile);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile Settings</h2>
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Display Name</h3>
          <p className="text-gray-600">{profile?.displayName}</p>
        </div>
        
        {profile?.bio && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
            <p className="text-gray-600">{profile.bio}</p>
          </div>
        )}
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Privacy</h3>
          <p className="text-gray-600">
            {profile?.isPrivate ? "Private profile" : "Public profile"}
          </p>
        </div>
      </div>
    </div>
  );
}
