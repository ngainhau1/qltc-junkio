import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { login } from "@/features/auth/authSlice"
import { setWallets } from "@/features/wallets/walletSlice"
import { setTransactions } from "@/features/transactions/transactionSlice"
import { generateMockData } from "@/utils/seeder"
import { MainLayout } from "@/components/layout/MainLayout"
import { Dashboard } from "@/pages/Dashboard"
import { Transactions } from "@/pages/Transactions"
import { Family } from "@/pages/Family"
import { Reports } from "@/pages/Reports"

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector(state => state.auth)
  const { transactions } = useSelector(state => state.transactions)

  useEffect(() => {
    // 1. Mock Login
    if (!isAuthenticated) {
      const mockUser = { id: 'u-1', name: 'Demo User', email: 'demo@junkio.com' }
      dispatch(login(mockUser))

      // 2. Seed Data if empty
      if (transactions.length === 0) {
        console.log("Seeding data...")
        const data = generateMockData(mockUser.id)
        dispatch(setWallets(data.wallets))
        dispatch(setTransactions(data.transactions))
      }
    }
  }, [dispatch, isAuthenticated, transactions.length])

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/family" element={<Family />} />
          <Route path="/reports" element={<Reports />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </Router>
  )
}

export default App;