import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Login } from '@/pages/Login'
import { Kanban } from '@/pages/Kanban'
import { Contacts } from '@/pages/Contacts'
import { Dashboard } from '@/pages/Dashboard'
import { History } from '@/pages/History'
import { DealHistory } from '@/pages/DealHistory'
import { Settings } from '@/pages/Settings'
// ERP Pages
import { Companies } from '@/pages/erp/Companies'
import { Clients } from '@/pages/erp/Clients'
import { ClientDetails } from '@/pages/erp/ClientDetails'
import { Contracts } from '@/pages/erp/Contracts'
import { Financial } from '@/pages/erp/Financial'
import { Templates } from '@/pages/erp/Templates'
import { Vehicles } from '@/pages/erp/Vehicles'
import { Instructors } from '@/pages/erp/Instructors'
import { Lessons } from '@/pages/erp/Lessons'
import { InstructorSchedule } from '@/pages/erp/InstructorSchedule'
import { DashboardERP } from '@/pages/erp/DashboardERP'
// System Pages
import { UserManagement } from '@/pages/UserManagement'
// Integration Pages
import { APIKeys } from '@/pages/APIKeys'
import { Webhooks } from '@/pages/Webhooks'
import { ChatwootEmbed } from '@/pages/integrations/ChatwootEmbed'
import { FaviconUpdater } from '@/components/branding/FaviconUpdater'


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <FaviconUpdater />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Kanban />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Contacts />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <History />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/deals/history"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DealHistory />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            {/* ERP Routes */}
            <Route
              path="/erp/companies"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Companies />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/clients"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Clients />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/clients/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ClientDetails />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/contracts"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Contracts />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/financial"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Financial />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/templates"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Templates />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/vehicles"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Vehicles />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/instructors"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Instructors />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/lessons"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Lessons />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/instructor-schedule"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <InstructorSchedule />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DashboardERP />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            {/* System Routes */}
            <Route
              path="/system/users"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <UserManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            {/* Integration Routes */}
            <Route
              path="/integrations/chatwoot"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ChatwootEmbed />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations/api-keys"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <APIKeys />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations/webhooks"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Webhooks />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
