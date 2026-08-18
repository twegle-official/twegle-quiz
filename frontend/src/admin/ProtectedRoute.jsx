import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

// Wraps an admin page and blocks access unless someone is logged in (and, if
// `roles` is given, unless they have one of those roles). Used to guard every
// admin route so logged-out visitors get sent to the login page.
export default function ProtectedRoute({ roles, children }) {
  const { session } = useAuth()

  // Not logged in at all — bounce to the login page
  if (!session) {
    return <Navigate to="/admin/login" replace />
  }
  // Logged in, but this page is restricted to certain roles the admin doesn't have
  if (roles && !roles.includes(session.admin.role)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-600 dark:text-gray-400">
        You don't have permission to view this page.
      </div>
    )
  }
  // Allowed — render the actual page
  return children
}
