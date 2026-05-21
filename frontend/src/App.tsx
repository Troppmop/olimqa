import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import QuestionPage from './pages/QuestionPage'
import AskPage from './pages/AskPage'
import EditQuestionPage from './pages/EditQuestionPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TagsPage from './pages/TagsPage'
import UserProfilePage from './pages/UserProfilePage'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/questions/:id" element={<QuestionPage />} />
            <Route path="/questions/:id/edit" element={<EditQuestionPage />} />
            <Route path="/ask" element={<AskPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/users/:id" element={<UserProfilePage />} />
          </Routes>
        </main>
        <footer className="border-t border-gray-200 bg-white py-6 mt-8">
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-gray-400">
            OlimQ&A — A community for Olim Chadashim &amp; Lone Soldiers in Israel
          </div>
        </footer>
      </div>
    </AuthProvider>
  )
}
