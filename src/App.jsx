import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Events } from './pages/Events';
import { Messages } from './pages/Messages';
import { Layout } from './components/Layout';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/events" element={<Events />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/resources" element={
              <Layout>
                <div className="text-center py-12">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Resources</h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">Coming Soon - Resource library will be available here.</p>
                </div>
              </Layout>
            } />
            <Route path="/settings" element={
              <Layout>
                <div className="text-center py-12">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Settings</h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">Coming Soon - Application settings will be available here.</p>
                </div>
              </Layout>
            } />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
