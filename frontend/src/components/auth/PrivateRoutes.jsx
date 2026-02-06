
import { Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"

export const PrivateRoutes = () => {
    const { isAuthenticated } = useSelector(state => state.auth)

    // In a real app, we might also check for token expiration here
    // const token = localStorage.getItem('auth_token')

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
