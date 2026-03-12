import { useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import api from "@/lib/api"

export function ResetPasswordPage() {
    const { t } = useTranslation()
    const { token } = useParams()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password.length < 6) {
            toast.error(t('auth.passwordLength', 'Mật khẩu phải có ít nhất 6 ký tự.'))
            return
        }
        if (password !== confirmPassword) {
            toast.error(t('auth.passwordMismatch', 'Mật khẩu xác nhận không khớp.'))
            return
        }

        setIsLoading(true)
        try {
            await api.post(`/auth/reset-password/${token}`, { password })
            toast.success(t('auth.resetPasswordSuccess', 'Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.'))
            navigate("/login")
        } catch (error) {
            toast.error(error.response?.data?.msg || t('auth.resetPasswordFailed', 'Đổi mật khẩu thất bại. Mã Token không hợp lệ hoặc đã hết hạn.'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full">
            <div className="mb-8 text-center sm:text-left">
                <h2 className="text-3xl font-bold tracking-tight">{t('auth.resetPasswordTitle', 'Tạo mật khẩu mới')}</h2>
                <p className="text-muted-foreground mt-2">
                    {t('auth.resetPasswordDesc', 'Vui lòng nhập mật khẩu mới bảo mật và dễ nhớ cho tài khoản của bạn.')}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.newPassword', 'Mật khẩu mới')}</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder={t('auth.passwordPlaceholder')}
                            className="pl-9 pr-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder={t('auth.passwordPlaceholder')}
                            className="pl-9 pr-10"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.resetPasswordBtn', 'Lưu mật khẩu và Đăng nhập')}
                </Button>
            </form>
            <div className="mt-8 text-center text-sm text-emerald-600 hover:underline">
                <Link to="/login" className="inline-flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('auth.backToLogin', 'Quay lại đăng nhập')}
                </Link>
            </div>
        </div>
    )
}
