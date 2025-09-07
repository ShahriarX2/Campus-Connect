# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Campus Connect is a modern campus management system built with React 19 and Vite. It provides student management, event management, messaging, and resource management with a responsive design and dark mode support.

## Common Development Commands

### Development Server
```bash
npm run dev          # Start development server on http://localhost:5173
```

### Build & Preview
```bash
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Code Quality
```bash
npm run lint         # Run ESLint on all files
```

### Testing
```bash
# Note: No test framework is currently configured
# Consider adding Vitest or Jest for testing:
# npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Update Supabase credentials:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Architecture Overview

### Core Technologies
- **Frontend**: React 19 + Vite for fast development
- **Styling**: TailwindCSS v4.1.13 with dark mode support
- **Authentication**: Supabase Auth with comprehensive error handling
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **State Management**: React Context (AuthContext, ThemeContext)
- **Routing**: React Router DOM v7
- **Error Tracking**: Sentry integration with custom auth utilities
- **UI Components**: Headless UI + Heroicons for accessibility
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion
- **Charts**: Recharts

### Key Architectural Patterns

#### Context-Driven Architecture
The app uses React Context extensively for global state:
- `AuthContext` (`src/context/AuthContext.jsx`) - Comprehensive authentication with Sentry integration, auto token refresh, emergency timeouts, and fallback profile creation
- `ThemeContext` (`src/context/ThemeContext.jsx`) - Dark/light theme with localStorage persistence and system preference detection

#### Layout System
- `Layout` component (`src/components/Layout.jsx`) - Main wrapper with sidebar and topbar
- `Sidebar` (`src/components/Sidebar.jsx`) - Collapsible navigation with active state indicators
- `Topbar` (`src/components/Topbar.jsx`) - Search, notifications, theme toggle, and user menu

#### Data Fetching Patterns
Custom hooks in `src/hooks/useData.js`:
- `useSupabaseQuery` - Generic Supabase querying with filters, ordering, and limits
- `useStudents`, `useEvents`, `useDashboardStats` - Specific data fetchers with mock data fallbacks
- `useMutation` - Generic create/update operations with error handling
- `useRealtimeSubscription` - Real-time data subscriptions

#### Authentication Flow
The AuthContext includes sophisticated error handling:
- Emergency timeout (10s) to prevent infinite loading
- Automatic token refresh every 90 minutes
- Fallback profile creation from user metadata
- Comprehensive Sentry tracking for debugging auth issues
- Performance monitoring for slow operations

#### Error Handling & Monitoring
- Sentry integration with custom `AuthSentryUtils` class
- Performance tracking for auth operations
- Loading state monitoring with timeout detection
- Breadcrumb tracking for debugging

### Component Structure
```
src/
├── components/           # Reusable UI components
│   ├── Layout.jsx       # Main layout wrapper
│   ├── Sidebar.jsx      # Navigation sidebar
│   └── Topbar.jsx       # Top navigation bar
├── pages/               # Page components
│   ├── Dashboard.jsx    # Dashboard with statistics
│   ├── Students.jsx     # Student management
│   ├── Events.jsx       # Event management with filtering
│   ├── Messages.jsx     # Real-time chat interface
│   └── Profile.jsx      # User profile management
├── context/             # React contexts
│   ├── AuthContext.jsx  # Authentication state & Sentry integration
│   └── ThemeContext.jsx # Theme management
├── hooks/               # Custom React hooks
│   └── useData.js       # Data fetching hooks with Supabase
├── lib/                 # Configuration
│   └── supabase.js      # Supabase client setup
├── utils/               # Utility functions
│   └── sentryAuth.js    # Sentry utilities for auth tracking
└── styles/              # Global styles
```

### Data Patterns

#### Mock Data Strategy
The app uses comprehensive mock data for development:
- Students, events, and dashboard statistics
- Chat messages and user interactions
- Ready for Supabase integration when backend is available

#### Real-time Features
- Chat interface with message history
- Event status tracking
- Real-time subscription hooks ready for Supabase real-time

## Development Best Practices

### Component Conventions
- All components use PropTypes for type checking
- Consistent dark mode support with `dark:` classes
- Heroicons for consistent iconography
- Responsive design with mobile-first approach

### State Management
- Use Context for global state (auth, theme)
- Custom hooks for data fetching and mutations
- Local state for component-specific data

### Styling Approach
- TailwindCSS utility classes
- Dark mode with `dark:` prefixes
- Consistent color scheme (blue primary, gray neutrals)
- Responsive breakpoints: `sm:`, `md:`, `lg:`

### Authentication Patterns
- Always check loading state before rendering auth-dependent content
- Use the comprehensive error handling in AuthContext
- Monitor Sentry for authentication issues
- Fallback gracefully when profile data is unavailable

### Error Handling
- Use try-catch blocks for async operations
- Display user-friendly error messages with React Hot Toast
- Log detailed errors to Sentry with context
- Provide fallback UI states for error conditions

## File Modification Guidelines

### Adding New Pages
1. Create component in `src/pages/`
2. Add route to router configuration
3. Add navigation item to `src/components/Sidebar.jsx`
4. Follow existing patterns for layout and error handling

### Data Integration
- Use custom hooks from `useData.js` for consistency
- Replace mock data with actual Supabase queries
- Maintain loading and error states
- Add real-time subscriptions for dynamic content

### UI Components
- Follow existing dark mode patterns
- Use PropTypes for all props
- Maintain responsive design
- Use Heroicons for consistency

### Authentication Features
- Leverage existing AuthContext capabilities
- Add Sentry tracking for new auth events
- Handle loading and error states properly
- Test with both authenticated and unauthenticated users

## Debugging & Monitoring

### Sentry Integration
- Auth events are tracked automatically
- Performance monitoring for slow operations
- Error tracking with detailed context
- Loading state monitoring with timeout detection

### Development Debugging
- Use React DevTools for component state
- Check browser console for auth events
- Monitor network tab for Supabase requests
- Use Sentry dashboard for error tracking in production

## Environment Notes

### Local Development
- Vite dev server provides fast HMR
- Mock data allows development without backend
- Theme persistence works with localStorage
- Authentication requires Supabase setup

### Production Considerations
- Sentry monitoring configured for error tracking
- Authentication token refresh runs automatically
- Theme preference respects system settings
- All assets are optimized through Vite build process
