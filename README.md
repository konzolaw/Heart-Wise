# 💕 HeartWise - Biblical Dating Advice Platform

A beautiful, faith-based social media platform designed for Christian singles and couples to receive biblical relationship advice, share testimonies, and build a loving community centered on God's design for relationships.

## ✨ Features

### 🏠 **Community Features**
- **Daily Bible Verses** - AI-powered biblical wisdom for relationships
- **Community Posts** - Share advice, testimonies, questions, and encouragement
- **Social Interactions** - Like, comment, and share meaningful content
- **Image Support** - Share posts with beautiful images
- **Category Filtering** - Browse by advice, testimony, questions, announcements

### 🤖 **AI-Powered Guidance**
- **Smart Bible Verse Generation** - Contextual scripture for daily inspiration
- **AI Chat Counseling** - Biblical relationship guidance when you need it
- **Personalized Recommendations** - Content tailored to your journey

### 👥 **Community & Connection**
- **User Profiles** - Share your story and connect with others
- **Testimonies Section** - Celebrate God's work in relationships
- **Live Chat** - Real-time community conversations
- **Video Calls** - Face-to-face fellowship and support

### 🔐 **Admin Management**
- **Content Moderation** - Keep the community safe and encouraging
- **User Management** - Comprehensive admin dashboard
- **Analytics** - Track community growth and engagement
- **Notification System** - Stay informed of important updates

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Convex (Real-time database & API)
- **Styling**: Tailwind CSS
- **Authentication**: Convex Auth
- **AI Integration**: OpenAI API
- **Deployment**: Vercel (frontend) + Convex (backend)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- A Convex account (sign up at [convex.dev](https://convex.dev))
- OpenAI API key for AI features

### Installation

1. **Clone the repository**
   ```bash
   git clone [your-repository-url]
   cd biblical_dating_advice_platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_CONVEX_URL=your_convex_deployment_url
   ```

4. **Initialize Convex**
   ```bash
   npx convex dev
   ```

5. **Configure OpenAI API Key in Convex**
   ```bash
   npx convex env set OPENAI_API_KEY your_openai_api_key
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5173` to see the application running!

## 📱 Usage

### For Community Members
1. **Sign up/Login** using the authentication system
2. **Complete your profile** to connect with the community
3. **Browse daily verses** for biblical inspiration
4. **Share posts** about your relationship journey
5. **Engage with content** through likes, comments, and shares
6. **Chat with AI counselor** for biblical guidance
7. **Join live discussions** with other community members

### For Administrators
1. **Access admin panel** (requires admin privileges)
2. **Moderate content** and manage community posts
3. **Review testimonies** before they go live
4. **Create announcements** for important updates
5. **Monitor platform health** through the dashboard
6. **Manage user accounts** and community safety

## 🎨 Design Philosophy

HeartWise is designed with love, intentionality, and biblical principles:

- **Beautiful & Modern UI** - Welcoming design that reflects God's beauty
- **Mobile-First** - Accessible on all devices for busy singles and couples
- **Scripture-Centered** - God's Word at the heart of every interaction
- **Community-Focused** - Building genuine relationships and support
- **Safe Environment** - Moderated content to maintain biblical standards

## 🔒 Security & Privacy

- **Secure Authentication** - Protected user accounts and data
- **Content Moderation** - All posts reviewed for community standards
- **Privacy Controls** - Users control their information sharing
- **Safe Communication** - Monitored interactions for safety

## 🤝 Contributing

We welcome contributions from the Christian developer community! Please:

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Test your changes thoroughly
5. Submit a pull request with a clear description

## 📄 License

This project is created for the Christian community. Please use responsibly and in accordance with biblical principles.
For collaboration contact Konzolaw on github .

## 🙏 Support

For technical support or questions about using the platform:
- Check existing issues in the repository
- Create a new issue with detailed information
- Join our community discussions

## 💝 Acknowledgments

Built with love for the Christian community, inspired by God's design for relationships and the power of fellowship in Christ.

---

*"Above all else, guard your heart, for everything you do flows from it." - Proverbs 4:23*

*"Two are better than one, because they have a good return for their labor..." - Ecclesiastes 4:9*
```

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server (both frontend and backend)
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard with posts
│   ├── CommunityFeed.tsx# Community posts feed
│   ├── DailyVerse.tsx   # AI-generated Bible verses
│   └── ...
├── main.tsx            # React entry point
└── index.css           # Global styles

convex/
├── posts.ts            # Post-related backend functions
├── auth.ts             # Authentication
├── schema.ts           # Database schema
└── ...
```

## 🔧 Troubleshooting Vercel Deployment

### Issue: Blank page after deployment
**Solution:** Make sure environment variables are set correctly in Vercel

### Issue: 404 errors on refresh
**Solution:** The `vercel.json` file should handle SPA routing (already configured)

### Issue: CSS not loading
**Solution:** Check that `index.html` references are correct (already fixed)

### Issue: Environment variables not working
**Solution:** Ensure `VITE_CONVEX_URL` is set in Vercel project settings

## 🌟 Features

- **AI-Generated Daily Bible Verses**
- **Community Posts with Social Features**
  - Like/Dislike reactions
  - Comments and replies
  - Share functionality
  - Author profiles
- **Real-time Updates**
- **Mobile-Responsive Design**
- **Dark Mode Support**
- **Faith-Based Content Moderation**

## 💫 Post Categories

- 📢 **Announcements**: Community events, workshops
- 💡 **Advice**: Dating wisdom, relationship guidance
- ✨ **Testimony**: Success stories and personal experiences
- ❓ **Questions**: Community discussions and Q&A
- 💪 **Encouragement**: Motivational and uplifting content

---

Built with ❤️ for the Christian community
