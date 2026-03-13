import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import api from "@/lib/api"

export function ForgotPasswordPage() {
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email) {
            toast.error(t('auth.emailRequired'))
            return
        }
        setIsLoading(true)
        try {
            await api.post('/auth/forgot-password', { email })
            toast.success(t('auth.forgotPasswordSuccess', 'Thư khôi phục mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.'))
        } catch (error) {
            toast.error(error.response?.data?.msg || t('auth.forgotPasswordFailed', 'Gửi thư thất bại, vui lòng thử lại sau.'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full">
            <div className="mb-8 text-center sm:text-left">
                <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('auth.backToLogin', 'Quay lại đăng nhập')}
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">{t('auth.forgotPassword')}</h2>
                <p className="text-muted-foreground mt-2">
                    {t('auth.forgotPasswordDesc', 'Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.')}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            placeholder={t('auth.emailPlaceholder')}
                            className="pl-9"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.sendResetLink', 'Gửi liên kết')}
                </Button>
            </form>
        </div>
    )
}
