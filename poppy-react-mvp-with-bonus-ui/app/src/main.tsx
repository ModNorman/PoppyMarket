import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './pages/App'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import UsersPage from './pages/UsersPage'
  import PayoutsPage from './pages/PayoutsPage'
import PasswordReset from './pages/PasswordReset'
import RequireAuth from './pages/RequireAuth'

const qc = new QueryClient()

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/password-reset', element: <PasswordReset /> },
  { path: '/seller', element: <RequireAuth role="seller"><SellerDashboard /></RequireAuth> },
  { path: '/admin', element: <RequireAuth role="admin"><AdminDashboard /></RequireAuth> },
  { path: '/admin/users', element: <RequireAuth role="admin"><UsersPage /></RequireAuth> },
    { path: '/admin/payouts', element: <RequireAuth role="admin"><PayoutsPage /></RequireAuth> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)
