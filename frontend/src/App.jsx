import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ShareSidebar from './components/ShareSidebar'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import Result from './pages/Result'
import Browse from './pages/Browse'
import PostView from './pages/PostView'
import StoryView from './pages/StoryView'
import PuzzleView from './pages/PuzzleView'
import HoroscopeView from './pages/HoroscopeView'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import About from './pages/About'
import FriendshipSetup from './pages/FriendshipSetup'
import FriendshipPlay from './pages/FriendshipPlay'
import FriendshipResult from './pages/FriendshipResult'
import CompareInvite from './pages/CompareInvite'
import CompareResult from './pages/CompareResult'
import SearchResults from './pages/SearchResults'
import Game from './pages/Game'
import TicTacToeMultiplayer from './pages/TicTacToeMultiplayer'
import Feedback from './pages/Feedback'
import Badges from './pages/Badges'
import BadgeToast from './components/BadgeToast'
import NotFound from './pages/NotFound'
import Signup from './pages/Signup'
import UserLogin from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Account from './pages/Account'
import { UserAuthProvider } from './UserAuthContext'

import { AuthProvider } from './admin/AuthContext'
import ProtectedRoute from './admin/ProtectedRoute'
import AdminLayout from './admin/AdminLayout'
import Login from './admin/pages/Login'
import Dashboard from './admin/pages/Dashboard'
import QuizList from './admin/pages/QuizList'
import QuizForm from './admin/pages/QuizForm'
import PostList from './admin/pages/PostList'
import PostForm from './admin/pages/PostForm'
import QuickAdd from './admin/pages/QuickAdd'
import BulkImport from './admin/pages/BulkImport'
import StoryList from './admin/pages/StoryList'
import StoryForm from './admin/pages/StoryForm'
import PuzzleList from './admin/pages/PuzzleList'
import PuzzleForm from './admin/pages/PuzzleForm'
import FriendshipQuizList from './admin/pages/FriendshipQuizList'
import FriendshipQuizForm from './admin/pages/FriendshipQuizForm'
import Analytics from './admin/pages/Analytics'
import Activity from './admin/pages/Activity'
import Admins from './admin/pages/Admins'
import FeedbackList from './admin/pages/FeedbackList'
import EndUserList from './admin/pages/EndUserList'

// React Router does client-side navigation, which (unlike a normal full page
// load) never resets scroll position on its own — without this, opening a
// quiz or clicking a footer link while scrolled down leaves the new page
// scrolled down too. Watches pathname+search (not just pathname) so it also
// fires for same-page links that only change the query string, e.g. the
// footer's "Friendship Quiz" link (`/?tab=friendship`).
function ScrollToTop() {
  const { pathname, search } = useLocation()

  // Without this, the browser's own "auto" scroll restoration on Back/Forward
  // races the effect below and wins — it restores the old scroll position
  // asynchronously, after our scrollTo(0, 0) already ran, so Back silently
  // lands you scrolled down again. Opting into manual restoration once here
  // makes every navigation (including Back/Forward) behave the same way.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, search])
  return null
}

function PublicSite() {
  return (
    <UserAuthProvider>
    <div className="min-h-screen flex flex-col bg-dot-pattern">
      <Header />
      <ShareSidebar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/account" element={<Account />} />
          <Route path="/quiz/:quizId" element={<Quiz />} />
          <Route path="/quiz/:quizId/vs/:code" element={<CompareInvite />} />
          <Route path="/quiz/:quizId/vs/:code/result" element={<CompareResult />} />
          <Route path="/result/:quizId/:resultKey" element={<Result />} />
          <Route path="/browse/:category" element={<Browse />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/games/:slug" element={<Game />} />
          <Route path="/games/tic-tac-toe/:code" element={<TicTacToeMultiplayer />} />
          <Route path="/post/:id" element={<PostView />} />
          <Route path="/story/:slug" element={<StoryView />} />
          <Route path="/puzzle/:id" element={<PuzzleView />} />
          <Route path="/horoscope/:sign" element={<HoroscopeView />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/about" element={<About />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/friendship/:slug" element={<FriendshipSetup />} />
          <Route path="/friendship/play/:code" element={<FriendshipPlay />} />
          <Route path="/friendship/result/:attemptId" element={<FriendshipResult />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <BadgeToast />
    </div>
    </UserAuthProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="quizzes" element={<QuizList />} />
          <Route
            path="quizzes/new"
            element={
              <ProtectedRoute roles={['superadmin', 'editor']}>
                <QuizForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="quizzes/:id/edit"
            element={
              <ProtectedRoute roles={['superadmin', 'editor']}>
                <QuizForm />
              </ProtectedRoute>
            }
          />
          <Route path="posts" element={<PostList />} />
          <Route
            path="quick-add"
            element={
              <ProtectedRoute roles={['superadmin', 'editor']}>
                <QuickAdd />
              </ProtectedRoute>
            }
          />
          <Route
            path="bulk-import"
            element={
              <ProtectedRoute roles={['superadmin', 'editor']}>
                <BulkImport />
              </ProtectedRoute>
            }
          />
          <Route
            path="posts/new"
            element={
              <ProtectedRoute roles={['superadmin', 'editor']}>
                <PostForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="posts/:id/edit"
            element={
              <ProtectedRoute roles={['superadmin', 'editor']}>
                <PostForm />
              </ProtectedRoute>
            }
          />
          <Route path="stories" element={<StoryList />} />
          <Route
            path="stories/new"
            element={
              <ProtectedRoute roles={['superadmin', 'editor']}>
                <StoryForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="stories/:id/edit"
            element={
              <ProtectedRoute roles={['superadmin', 'editor']}>
                <StoryForm />
              </ProtectedRoute>
            }
          />
          <Route path="puzzles" element={<PuzzleList />} />
          <Route
            path="puzzles/new"
            element={
              <ProtectedRoute roles={['superadmin', 'editor']}>
                <PuzzleForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="puzzles/:id/edit"
            element={
              <ProtectedRoute roles={['superadmin', 'editor']}>
                <PuzzleForm />
              </ProtectedRoute>
            }
          />
          <Route path="friendship-quizzes" element={<FriendshipQuizList />} />
          <Route
            path="friendship-quizzes/new"
            element={
              <ProtectedRoute roles={['superadmin', 'editor']}>
                <FriendshipQuizForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="friendship-quizzes/:id/edit"
            element={
              <ProtectedRoute roles={['superadmin', 'editor']}>
                <FriendshipQuizForm />
              </ProtectedRoute>
            }
          />
          <Route path="analytics" element={<Analytics />} />
          <Route path="activity" element={<Activity />} />
          <Route path="feedback" element={<FeedbackList />} />
          <Route path="end-users" element={<EndUserList />} />
          <Route
            path="admins"
            element={
              <ProtectedRoute roles={['superadmin']}>
                <Admins />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/*" element={<PublicSite />} />
      </Routes>
    </AuthProvider>
  )
}
