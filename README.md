# 🎓 Campus Connect

A modern, feature-rich campus management system built with React and TailwindCSS. Campus Connect provides a comprehensive platform for managing students, events, messaging, and campus resources with a beautiful, responsive interface.

## ✨ Features

- **🏠 Dashboard** - Overview with statistics, recent activity, and key metrics
- **👥 Student Management** - Comprehensive student profiles and management system
- **📅 Event Management** - Create, manage, and track campus events with filtering and status tracking
- **💬 Real-time Messaging** - Chat interface for seamless campus communication
- **📚 Resource Library** - Centralized resource management (coming soon)
- **⚙️ Settings** - User preferences and system configuration (coming soon)
- **🌙 Dark Mode** - Complete dark/light theme support with system preference detection
- **📱 Responsive Design** - Mobile-first design that works on all devices
- **🔐 Authentication** - Secure authentication system with Supabase integration

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: TailwindCSS v4.1.13
- **Routing**: React Router DOM
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **UI Components**: Headless UI + Heroicons
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Type Safety**: PropTypes

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for backend features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/campus-connect.git
   cd campus-connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
campus-connect/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.jsx       # Main layout with sidebar and topbar
│   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   └── Topbar.jsx       # Top navigation bar
│   ├── pages/              # Page components
│   │   ├── Dashboard.jsx    # Dashboard overview
│   │   ├── Students.jsx     # Student management
│   │   ├── Events.jsx       # Event management
│   │   └── Messages.jsx     # Chat interface
│   ├── context/            # React contexts
│   │   ├── AuthContext.jsx  # Authentication state
│   │   └── ThemeContext.jsx # Theme management
│   ├── hooks/              # Custom React hooks
│   │   └── useData.js       # Data fetching hooks
│   ├── lib/                # Utilities and configurations
│   │   └── supabase.js      # Supabase client
│   ├── styles/             # Global styles
│   └── utils/              # Helper functions
├── public/                 # Static assets
├── .env.example           # Environment variables template
└── README.md              # Project documentation
```

## 🎨 UI Components

### Layout System
- **Responsive Sidebar**: Collapsible navigation with active state indicators
- **Dynamic Topbar**: Search, notifications, theme toggle, and user menu
- **Content Area**: Flexible main content with proper spacing and typography

### Key Features
- **Dark Mode**: Automatic system detection with manual toggle
- **Mobile Responsive**: Seamless experience across all device sizes
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Loading States**: Smooth loading experiences throughout the app

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 Authentication

Campus Connect uses Supabase Auth for secure authentication:

- **Email/Password Authentication**
- **Google OAuth** (configurable)
- **Password Reset**
- **Profile Management**
- **Session Management**

## 📊 Data Management

### Custom Hooks
- `useStudents()` - Fetch and manage student data
- `useEvents()` - Event management and filtering
- `useDashboardStats()` - Dashboard statistics
- `useMutation()` - Create/update operations
- `useSupabaseQuery()` - Generic database queries

### Mock Data
The application includes comprehensive mock data for development and testing purposes.

## 🌟 Key Features Explained

### Dashboard
- **Statistics Cards**: Total students, events, messages, resources
- **Recent Activity Feed**: Real-time campus activity updates
- **Quick Actions**: Easy access to frequently used features

### Event Management
- **Event Filtering**: Filter by status (upcoming, ongoing, completed)
- **Event Cards**: Rich event information with attendee counts
- **Status Tracking**: Visual status indicators
- **Search & Filter**: Find events quickly

### Messaging System
- **Real-time Chat**: Instant messaging interface
- **Contact List**: Organized conversation management
- **File Sharing**: Support for attachments and media (UI ready)
- **Online Status**: See who's currently online

## 🎯 Future Enhancements

- [ ] File upload and media management
- [ ] Advanced analytics and reporting
- [ ] Push notifications
- [ ] Calendar integration
- [ ] Advanced search and filtering
- [ ] Role-based permissions
- [ ] API documentation
- [ ] Mobile app (React Native)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Shahriar**
- Email: shahriarhossen550@gmail.com
- GitHub: [@ShahriarX2](https://github.com/ShahriarX2)

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - The web framework used
- [TailwindCSS](https://tailwindcss.com/) - For styling
- [Supabase](https://supabase.com/) - Backend as a Service
- [Heroicons](https://heroicons.com/) - Beautiful icons
- [Headless UI](https://headlessui.com/) - Unstyled, accessible components

---

⭐ **Star this repo if you find it helpful!**
