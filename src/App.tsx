import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { ProfileSetup } from "./components/ProfileSetup";
import { useState, useEffect } from "react";

export default function App() {
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) {
      setDarkMode(JSON.parse(saved));
    } else {
      // If no saved preference, default to dark mode
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900">
      <Authenticated>
        <AuthenticatedApp darkMode={darkMode} setDarkMode={setDarkMode} />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedApp darkMode={darkMode} setDarkMode={setDarkMode} />
      </Unauthenticated>
      <Toaster theme={darkMode ? "dark" : "light"} />
    </div>
  );
}

function AuthenticatedApp({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (value: boolean) => void }) {
  const profile = useQuery(api.profiles.getCurrentProfile);
  
  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!profile) {
    return <ProfileSetup />;
  }

  return <Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />;
}

function UnauthenticatedApp({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (value: boolean) => void }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">❤️</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                HeartWise
              </h1>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Biblical Wisdom for
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {" "}Modern Dating
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
              Get personalized relationship advice grounded in Biblical principles. 
              Connect with a community of believers seeking God-honoring relationships.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">AI Biblical Counselor</h3>
              <p className="text-gray-600 dark:text-slate-300">Get instant, scripture-based advice for your dating questions</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Community Support</h3>
              <p className="text-gray-600 dark:text-slate-300">Share experiences and get encouragement from fellow believers</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Private & Safe</h3>
              <p className="text-gray-600 dark:text-slate-300">Your conversations and posts remain completely private</p>
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <SignInForm />
          </div>
        </div>
      </main>
    </div>
  );
}
