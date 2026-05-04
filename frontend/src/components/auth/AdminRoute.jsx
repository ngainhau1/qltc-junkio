import { Navigate } from "react-router-dom"
import { useSelector } from "react-redux"

// Trang chặn người ngoài nếu cố tình vào Dashboard của Admin
export const AdminRoute = ({ children }) => {
    const { isAuthenticated, user } = useSelector(state => state.auth)

    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (user?.role !== 'admin') return <Navigate to="/" replace />

    return children
}
