import { SignOutButton } from "../SignOutButton";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function Navbar({ darkMode, setDarkMode, currentTab, setCurrentTab }: NavbarProps) {
  const user = useQuery(api.auth.loggedInUser);
  const isAdmin = user?.email === "admin@heartwise.com";

  const navItems = [
    { id: "dashboard", name: "Dashboard", icon: "🏠" },
    { id: "chat", name: "AI Chat", icon: "🤖" },
    { id: "community", name: "Community", icon: "👥" },
    { id: "live-chat", name: "Live Chat", icon: "💬" },
    { id: "video-calls", name: "Video Calls", icon: "📹" },
    { id: "testimonies", name: "Testimonies", icon: "✨" },
    { id: "profile", name: "Profile", icon: "👤" },
    ...(isAdmin ? [{ id: "admin", name: "Admin", icon: "⚙️" }] : []),
  ];

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">❤️</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              HeartWise
            </h1>
          </div>

          {/* Navigation Items - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === item.id
                    ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{item.icon}</span>
                <span className="hidden lg:inline">{item.name}</span>
              </button>
            ))}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <SignOutButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  currentTab === item.id
                    ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{item.icon}</span>
                <span className="text-xs">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
