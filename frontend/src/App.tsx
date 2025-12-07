import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Templates from './pages/Templates'
import TemplateForm from './pages/TemplateForm'
import TemplateDetail from './pages/TemplateDetail'
import InspectionList from './pages/InspectionList'
import StartInspection from './pages/StartInspection'
import InspectionExecution from './pages/InspectionExecution'
import InspectionDetail from './pages/InspectionDetail'
import UserManagement from './pages/UserManagement'

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="card max-w-md w-full text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-gray-600">Page not found</p>
    </div>
  </div>
)

// Root redirect component
const RootRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  useEffect(() => {
    console.log('ElektroInspect PWA initialized')
  }, [])

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['INSPECTOR', 'ADMIN']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Template routes - Admin only */}
          <Route
            path="/templates"
            element={
              <AdminRoute>
                <Templates />
              </AdminRoute>
            }
          />
          <Route
            path="/templates/new"
            element={
              <AdminRoute>
                <TemplateForm />
              </AdminRoute>
            }
          />
          <Route
            path="/templates/:id"
            element={
              <AdminRoute>
                <TemplateDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/templates/:id/edit"
            element={
              <AdminRoute>
                <TemplateForm />
              </AdminRoute>
            }
          />

          {/* Inspection routes */}
          <Route
            path="/inspections"
            element={
              <ProtectedRoute allowedRoles={['INSPECTOR', 'ADMIN']}>
                <InspectionList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inspections/new"
            element={
              <ProtectedRoute allowedRoles={['INSPECTOR', 'ADMIN']}>
                <StartInspection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inspections/:id/execute"
            element={
              <ProtectedRoute allowedRoles={['INSPECTOR', 'ADMIN']}>
                <InspectionExecution />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inspections/:id/view"
            element={
              <ProtectedRoute allowedRoles={['INSPECTOR', 'ADMIN']}>
                <InspectionDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inspections/:id"
            element={
              <ProtectedRoute allowedRoles={['INSPECTOR', 'ADMIN']}>
                <InspectionDetail />
              </ProtectedRoute>
            }
          />

          {/* User Management */}
          <Route
            path="/users"
            element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
