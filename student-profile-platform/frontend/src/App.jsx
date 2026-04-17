import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StudentProfile from './pages/StudentProfile'
import Leaderboard from './pages/Leaderboard'
import Recruiters from './pages/Recruiters'
import RecruiterProfile from './pages/RecruiterProfile'
import AdminPanel from './pages/AdminPanel'
import Posts from './pages/Posts'
import RecruiterInsights from './pages/RecruiterInsights'
import Messages from './pages/Messages'
import LearningHub from './pages/LearningHub'
import { AnimatePresence } from 'framer-motion'

function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/student/:username" element={<StudentProfile />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/insights" element={<RecruiterInsights />} />
        <Route path="/recruiter/:username" element={<RecruiterProfile />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/learning" element={<LearningHub />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white dark:bg-surface-900 transition-colors duration-300">
            <Navbar />
            <main className="pt-14 sm:pt-16">
              <AnimatedRoutes />
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
