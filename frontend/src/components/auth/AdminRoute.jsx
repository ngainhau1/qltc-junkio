import { Navigate } from "react-router-dom"
import { useSelector } from "react-redux"

export const AdminRoute = ({ children }) => {
    const { isAuthenticated, user } = useSelector(state => state.auth)

    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (user?.role !== 'admin') return <Navigate to="/" replace />

    return children
}
