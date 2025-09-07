import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Events } from './pages/Events';
import { Messages } from './pages/Messages';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { Layout } from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import RoleGuard from './components/RoleGuard';
import AuthDebug from './components/AuthDebug';
import DetailedDebugLog from './components/DetailedDebugLog';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              
              <Route path="/students" element={
                <PrivateRoute>
                  <RoleGuard roles={['teacher', 'admin']}>
                    <Students />
                  </RoleGuard>
                </PrivateRoute>
              } />
              
              <Route path="/events" element={
                <PrivateRoute>
                  <Events />
                </PrivateRoute>
              } />
              
              <Route path="/messages" element={
                <PrivateRoute>
                  <Messages />
                </PrivateRoute>
              } />
              
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              
              <Route path="/resources" element={
                <PrivateRoute>
                  <Layout>
                    <div className="text-center py-12">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Resources</h1>
                      <p className="text-gray-600 dark:text-gray-400 text-lg">Coming Soon - Resource library will be available here.</p>
                    </div>
                  </Layout>
                </PrivateRoute>
              } />
              
              <Route path="/settings" element={
                <PrivateRoute>
                  <RoleGuard roles={['admin']}>
                    <Layout>
                      <div className="text-center py-12">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Settings</h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">Coming Soon - Admin settings will be available here.</p>
                      </div>
                    </Layout>
                  </RoleGuard>
                </PrivateRoute>
              } />
            </Routes>
            <Toaster position="top-right" />
            <AuthDebug />
            {import.meta.env.DEV && <DetailedDebugLog />}
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
