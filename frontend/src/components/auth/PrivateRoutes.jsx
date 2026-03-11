
import { Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"

export const PrivateRoutes = () => {
    const { isAuthenticated, token, loading } = useSelector(state => state.auth)

    // Nếu có token trong localStorage nhưng fetchCurrentUser chưa xong → hiển thị Loading
    // Điều này ngăn chặn việc redirect sang /login trước khi API kịp xác minh session
    if (token && !isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Đang khôi phục phiên...</p>
                </div>
            </div>
        )
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
