import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import PolicyList from '@/pages/PolicyList'
import PolicyDetail from '@/pages/PolicyDetail'
import MySignatures from '@/pages/MySignatures'
import AdminDashboard from '@/pages/AdminDashboard'
import StaffManagement from '@/pages/StaffManagement'
import PolicyManagement from '@/pages/PolicyManagement'
import ComplianceReports from '@/pages/ComplianceReports'

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading, user } = useAuth()

  if (isLoading || !user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <AuthenticatedRoute>
              <Dashboard />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/policies"
          element={
            <AuthenticatedRoute>
              <PolicyList />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/policies/:id"
          element={
            <AuthenticatedRoute>
              <PolicyDetail />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/signatures"
          element={
            <AuthenticatedRoute>
              <MySignatures />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <AdminRoute>
              <StaffManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/policies"
          element={
            <AdminRoute>
              <PolicyManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <ComplianceReports />
            </AdminRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
