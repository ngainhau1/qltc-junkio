import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster, toast } from 'sonner'
import { io } from "socket.io-client"
import { fetchCurrentUser } from "@/features/auth/authSlice"
import { MainLayout } from "@/components/layout/MainLayout"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { PrivateRoutes } from "@/components/auth/PrivateRoutes"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"
import { Dashboard } from "@/pages/Dashboard"
import { Transactions } from "@/pages/Transactions"
import { Wallets } from "@/pages/Wallets"
import { Family } from "@/pages/Family"
import { Reports } from "@/pages/Reports"
import { Settings } from "@/pages/Settings"
import { Goals } from "@/pages/Goals"
import { Profile } from "@/pages/Profile"
import { MobileMenu } from "@/pages/MobileMenu"
import { Forecast } from "@/pages/Forecast"
import { AdminDashboard } from "@/pages/AdminDashboard"
import { fetchWallets } from "@/features/wallets/walletSlice"
import { fetchFamilies } from "@/features/families/familySlice"
import { fetchGoals } from "@/features/goals/goalsSlice"
import { fetchRecurring } from "@/features/recurring/recurringSlice"
import { fetchTransactions } from "@/features/transactions/transactionSlice"

import { runRecurringEngine } from "@/services/recurringService"
import { store } from "@/store"

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, token, user } = useSelector(state => state.auth)

  // 1. Check Auth Session on Mount
  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, user]);

  // 2. Fetch App Data when Authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWallets());
      dispatch(fetchFamilies());
      dispatch(fetchGoals());
      dispatch(fetchRecurring());
      dispatch(fetchTransactions()); // Tạm lấy tất cả hoặc theo range filter ở transactionSlice
      
      // Khởi động trình quét recurring
      const count = runRecurringEngine(store)
      if (count > 0) {
        toast.success(`Đã tự động tạo ${count} giao dịch định kỳ đến hạn.`, {
          duration: 5000,
        })
      }
    }
  }, [dispatch, isAuthenticated]);

  // 3. Setup WebSocket push notifications
  useEffect(() => {
    let socket;
    if (isAuthenticated && user) {
      // Kết nối đến root domain của API (bỏ /api)
      const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');
      socket = io(socketUrl, {
        withCredentials: true
      });

      socket.on('connect', () => {
        // Đăng ký nhận thông báo cá nhân
        socket.emit('join_user_room', user.id);
      });

      // Lắng nghe sự kiện thông báo thời gian thực
      socket.on('NEW_NOTIFICATION', (data) => {
        if (data.type === 'alert') {
          toast.error(data.message, { duration: 8000 });
        } else if (data.type === 'success') {
          toast.success(data.message);
        } else {
          toast.info(data.message);
        }
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  // (Optional) Remove old Run Recurring Checks logic if not needed separately

  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public Routes - Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
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
            <Route path="/menu" element={<MobileMenu />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  )
}

export default App;