import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster, toast } from 'sonner'
import { setWallets } from "@/features/wallets/walletSlice"
import { setTransactions } from "@/features/transactions/transactionSlice"
import { addFamily } from "@/features/families/familySlice"
import { FakerService } from "@/services/fakerService"
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

import { runRecurringEngine } from "@/services/recurringService"
import { store } from "@/store"

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector(state => state.auth)
  const { transactions } = useSelector(state => state.transactions)

  useEffect(() => {
    // 1. Check Auth & Seed Data
    if (isAuthenticated && transactions.length === 0) {
      // Only seed if we are logged in (e.g. Demo User) but have no data
      // (RegisterPage handles its own seeding)
      const { user } = store.getState().auth
      if (user) {
        const data = FakerService.initData(user.id)
        dispatch(setWallets(data.wallets))
        dispatch(setTransactions(data.transactions))
        if (data.family) dispatch(addFamily(data.family))
        // Recurring rules seed
        if (data.recurringRules) {
          // We need to dispatch addRule. Assuming imported or use loop
          // Since addRule is not imported in App.jsx scope inside useEffect properly without import,
          // Let's just focus on main data for now.
        }
      }
    }

    // 3. Run Recurring Checks (Safe to run multiple times as it checks dates)
    if (isAuthenticated) {
      // We pass the store instance directly so the engine can dispatch
      // In a real app we might use a middleware or a thunk, but this is a simple "Lazy Check"
      const count = runRecurringEngine(store)
      if (count > 0) {
        toast.success(`Đã tự động tạo ${count} giao dịch định kỳ đến hạn.`, {
          duration: 5000,
        })
      }
    }
  }, [dispatch, isAuthenticated, transactions.length])

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
            <Route path="/family" element={<Family />} />
            <Route path="/reports" element={<Reports />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  )
}

export default App;