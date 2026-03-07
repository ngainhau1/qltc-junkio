import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster, toast } from 'sonner'
import { fetchCurrentUser } from "@/features/auth/authSlice"
import { MainLayout } from "@/components/layout/MainLayout"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { PrivateRoutes } from "@/components/auth/PrivateRoutes"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { Dashboard } from "@/pages/Dashboard"
import { Transactions } from "@/pages/Transactions"
import { Wallets } from "@/pages/Wallets"
import { Family } from "@/pages/Family"
import { Reports } from "@/pages/Reports"
import { Settings } from "@/pages/Settings"
import { Goals } from "@/pages/Goals"
import { Profile } from "@/pages/Profile"

import { runRecurringEngine } from "@/services/recurringService"
import { store } from "@/store"

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, token, user } = useSelector(state => state.auth)
  const { transactions } = useSelector(state => state.transactions)

  // 1. Check Auth Session on Mount
  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, user]);

  // 3. Run Recurring Checks (Safe to run multiple times as it checks dates)
  useEffect(() => {
    if (isAuthenticated) {
      const count = runRecurringEngine(store)
      if (count > 0) {
        toast.success(`Đã tự động tạo ${count} giao dịch định kỳ đến hạn.`, {
          duration: 5000,
        })
      }
    }
  }, [isAuthenticated, transactions.length])

  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public Routes - Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Private Routes - App */}
        <Route element={<PrivateRoutes />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/wallets" element={<Wallets />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/family" element={<Family />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  )
}

export default App;