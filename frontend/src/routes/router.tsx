import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { RequireAuth } from './RequireAuth'
import { RequireRole } from './RequireRole'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { ChangePasswordPage } from '../pages/ChangePasswordPage'
import { AccountPartyPage } from '../pages/masters/AccountPartyPage'
import { CourierCompanyPage } from '../pages/masters/CourierCompanyPage'
import { PincodeMasterPage } from '../pages/masters/PincodeMasterPage'
import { AccountBookingPage } from '../pages/bookings/AccountBookingPage'
import { CashBookingPage } from '../pages/bookings/CashBookingPage'
import { ReportsPage } from '../pages/ReportsPage'
import { SettingsPage } from '../pages/SettingsPage'
import { BillingPage } from '../pages/BillingPage'
import { StatusPage } from '../pages/StatusPage'
import { UsersPage } from '../pages/UsersPage'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    path: '/app',
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          {
            path: 'dashboard',
            element: (
              <RequireRole>
                <DashboardPage />
              </RequireRole>
            ),
          },
          {
            path: 'account-party',
            element: (
              <RequireRole>
                <AccountPartyPage />
              </RequireRole>
            ),
          },
          {
            path: 'courier-company',
            element: (
              <RequireRole>
                <CourierCompanyPage />
              </RequireRole>
            ),
          },
          {
            path: 'pincode',
            element: (
              <RequireRole>
                <PincodeMasterPage />
              </RequireRole>
            ),
          },
          {
            path: 'account-booking',
            element: (
              <RequireRole>
                <AccountBookingPage />
              </RequireRole>
            ),
          },
          {
            path: 'cash-booking',
            element: (
              <RequireRole>
                <CashBookingPage />
              </RequireRole>
            ),
          },
          {
            path: 'status',
            element: (
              <RequireRole>
                <StatusPage />
              </RequireRole>
            ),
          },
          {
            path: 'reports',
            element: (
              <RequireRole>
                <ReportsPage />
              </RequireRole>
            ),
          },
          {
            path: 'users',
            element: (
              <RequireRole>
                <UsersPage />
              </RequireRole>
            ),
          },
          {
            path: 'billing',
            element: (
              <RequireRole>
                <BillingPage />
              </RequireRole>
            ),
          },
          {
            path: 'settings',
            element: (
              <RequireRole>
                <SettingsPage />
              </RequireRole>
            ),
          },
          {
            path: 'change-password',
            element: (
              <RequireRole>
                <ChangePasswordPage />
              </RequireRole>
            ),
          },
          { path: 'unauthorized', element: <UnauthorizedPage /> },
        ],
      },
    ],
  },
])
