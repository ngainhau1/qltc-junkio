import { Suspense, lazy, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { io } from 'socket.io-client';
import { fetchCurrentUser } from '@/features/auth/authSlice';
import { addNotification } from '@/features/notifications/notificationsSlice';
import { fetchDashboardAnalytics, fetchReportAnalytics } from '@/features/analytics/analyticsSlice';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PrivateRoutes } from '@/components/auth/PrivateRoutes';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { Dashboard } from '@/pages/Dashboard';
import { Wallets } from '@/pages/Wallets';
import { Family } from '@/pages/Family';
import { Settings } from '@/pages/Settings';
import { Goals } from '@/pages/Goals';
import { Profile } from '@/pages/Profile';
import { MobileMenu } from '@/pages/MobileMenu';
import { fetchWallets } from '@/features/wallets/walletSlice';
import { fetchFamilies } from '@/features/families/familySlice';
import { fetchGoals } from '@/features/goals/goalsSlice';
import { fetchRecurring } from '@/features/recurring/recurringSlice';
import { fetchTransactions } from '@/features/transactions/transactionSlice';

const Transactions = lazy(() =>
    import('@/pages/Transactions').then((module) => ({ default: module.Transactions }))
);
const Reports = lazy(() =>
    import('@/pages/Reports').then((module) => ({ default: module.Reports }))
);
const Forecast = lazy(() =>
    import('@/pages/Forecast').then((module) => ({ default: module.Forecast }))
);
const AdminDashboard = lazy(() =>
    import('@/pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard }))
);

const RouteLoader = () => (
    <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
);

function App() {
    const dispatch = useDispatch();
    const { isAuthenticated, token, user } = useSelector((state) => state.auth);
    const { activeFamilyId } = useSelector((state) => state.families);

    useEffect(() => {
        if (token && !user) {
            dispatch(fetchCurrentUser());
        }
    }, [dispatch, token, user]);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        dispatch(fetchWallets());
        dispatch(fetchFamilies());
        dispatch(fetchGoals());
        dispatch(fetchRecurring());
    }, [dispatch, isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        dispatch(fetchTransactions());
        dispatch(fetchDashboardAnalytics());
        dispatch(fetchReportAnalytics());
    }, [dispatch, isAuthenticated, activeFamilyId]);

    useEffect(() => {
        let socket;

        if (isAuthenticated && user) {
            const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';
            socket = io(socketUrl, {
                withCredentials: true,
            });

            socket.on('connect', () => {
                socket.emit('join_user_room', user.id);
            });

            socket.on('NEW_NOTIFICATION', (data) => {
                dispatch(addNotification(data));

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
    }, [dispatch, isAuthenticated, user]);

    return (
        <Router>
            <Toaster position="top-right" richColors />
            <Routes>
                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                </Route>

                <Route element={<PrivateRoutes />}>
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route
                            path="/transactions"
                            element={
                                <Suspense fallback={<RouteLoader />}>
                                    <Transactions />
                                </Suspense>
                            }
                        />
                        <Route path="/wallets" element={<Wallets />} />
                        <Route path="/goals" element={<Goals />} />
                        <Route path="/family" element={<Family />} />
                        <Route
                            path="/reports"
                            element={
                                <Suspense fallback={<RouteLoader />}>
                                    <Reports />
                                </Suspense>
                            }
                        />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/menu" element={<MobileMenu />} />
                        <Route
                            path="/forecast"
                            element={
                                <Suspense fallback={<RouteLoader />}>
                                    <Forecast />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <AdminRoute>
                                    <Suspense fallback={<RouteLoader />}>
                                        <AdminDashboard />
                                    </Suspense>
                                </AdminRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
