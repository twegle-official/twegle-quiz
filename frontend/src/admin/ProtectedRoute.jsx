import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ roles, children }) {
  const { session } = useAuth()

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }
  if (roles && !roles.includes(session.admin.role)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-600">
        You don't have permission to view this page.
      </div>
    )
  }
  return children
}
