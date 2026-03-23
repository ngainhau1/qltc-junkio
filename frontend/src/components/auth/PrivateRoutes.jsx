import { Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import { useTranslation } from "react-i18next"

export const PrivateRoutes = () => {
    const { t } = useTranslation()
    const { isAuthenticated, token } = useSelector((state) => state.auth)

    if (token && !isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">{t('common.restoringSession')}</p>
                </div>
            </div>
        )
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
