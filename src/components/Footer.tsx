interface FooterProps {
  onNavigate?: (tab: string) => void;
}

export function Footer({ onNavigate }: FooterProps = {}) {
  const currentYear = new Date().getFullYear();

  const handleFeatureClick = (feature: string) => {
    if (onNavigate) {
      switch (feature) {
        case 'ai-counselor':
          onNavigate('chat');
          break;
        case 'community':
          onNavigate('community');
          break;
        case 'live-chat':
          onNavigate('live-chat');
          break;
        case 'video-calls':
          onNavigate('video-calls');
          break;
        case 'testimonies':
          onNavigate('testimonies');
          break;
        default:
          break;
      }
    }
  };

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">❤️</span>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                HeartWise
              </h3>
            </div>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              Biblical wisdom for modern dating. Building God-honoring relationships 
              through faith-based guidance and community support.
            </p>
            <div className="text-xs text-gray-500 dark:text-slate-500">
              "Trust in the Lord with all your heart" - Proverbs 3:5
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Features</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
              <li 
                className="flex items-center space-x-2 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                onClick={() => handleFeatureClick('ai-counselor')}
              >
                <span className="text-purple-500">🤖</span>
                <span>AI Biblical Counselor</span>
              </li>
              <li 
                className="flex items-center space-x-2 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                onClick={() => handleFeatureClick('community')}
              >
                <span className="text-purple-500">👥</span>
                <span>Community Support</span>
              </li>
              <li 
                className="flex items-center space-x-2 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                onClick={() => handleFeatureClick('live-chat')}
              >
                <span className="text-purple-500">💬</span>
                <span>Live Chat Rooms</span>
              </li>
              <li 
                className="flex items-center space-x-2 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                onClick={() => handleFeatureClick('video-calls')}
              >
                <span className="text-purple-500">📹</span>
                <span>Video Calls</span>
              </li>
              <li 
                className="flex items-center space-x-2 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                onClick={() => handleFeatureClick('testimonies')}
              >
                <span className="text-purple-500">✨</span>
                <span>Testimonies & Stories</span>
              </li>
            </ul>
          </div>

          {/* Community Guidelines */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Community Values</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
              <li className="flex items-center space-x-2">
                <span className="text-pink-500">🙏</span>
                <span>Faith-centered discussions</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-pink-500">💝</span>
                <span>Respectful interactions</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-pink-500">🔒</span>
                <span>Safe & private space</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-pink-500">🤝</span>
                <span>Supportive community</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-pink-500">📖</span>
                <span>Biblical principles</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500 dark:text-slate-500">
              © {currentYear} HeartWise. Built with faith and love.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-slate-500">
              <span className="flex items-center space-x-1">
                <span>🛡️</span>
                <span>Privacy First</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>📖</span>
                <span>Scripture-Based</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>💙</span>
                <span>Christ-Centered</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
