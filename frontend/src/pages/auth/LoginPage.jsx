import { useFormik } from "formik"
import * as Yup from "yup"
import { useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { loginUser } from "@/features/auth/authSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook } from "react-icons/fa"
import { useState } from "react"
import { useTranslation } from "react-i18next"

export function LoginPage() {
    const { t } = useTranslation();

    // Validation Schema
    const LoginSchema = Yup.object().shape({
        email: Yup.string().email(t('auth.emailInvalid')).required(t('auth.emailRequired')),
        password: Yup.string().required(t('auth.passwordRequired')),
    })

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const formik = useFormik({
        initialValues: {
            email: "",
            password: "",
        },
        validationSchema: LoginSchema,
        onSubmit: async (values) => {
            setIsLoading(true);
            try {
                // Submit credentials to the real backend
                await dispatch(loginUser({ email: values.email, password: values.password })).unwrap();
                toast.success(t('auth.loginSuccess'));
                navigate("/");
            } catch (error) {
                // Error structure comes from rejectWithValue in thunk
                toast.error(error || t('auth.loginFailed', 'Đăng nhập không thành công, vui lòng thử lại'));
            } finally {
                setIsLoading(false);
            }
        },
    })

    const handleMockGoogleLogin = () => {
        toast.info(t('auth.socialLoginComingSoon'));
    }

    return (
        <div className="w-full">
            <div className="mb-8 text-center sm:text-left">
                <h2 className="text-3xl font-bold tracking-tight">{t('auth.loginTitle')}</h2>
                <p className="text-muted-foreground mt-2">
                    {t('auth.loginDesc')}
                </p>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            placeholder={t('auth.emailPlaceholder')}
                            className="pl-9"
                            {...formik.getFieldProps("email")}
                        />
                    </div>
                    {formik.touched.email && formik.errors.email && (
                        <p className="text-sm text-red-500">{formik.errors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t('auth.password')}</Label>
                        <Link to="/forgot-password" className="text-sm font-medium text-emerald-600 hover:text-emerald-500 hover:underline">
                            {t('auth.forgotPassword')}
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder={t('auth.passwordPlaceholder')}
                            className="pl-9 pr-10"
                            {...formik.getFieldProps("password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {formik.touched.password && formik.errors.password && (
                        <p className="text-sm text-red-500">{formik.errors.password}</p>
                    )}
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.login')}
                </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4">
                <span className="h-px w-full bg-border" />
                <span className="text-xs text-muted-foreground uppercase whitespace-nowrap">{t('auth.orContinueWith')}</span>
                <span className="h-px w-full bg-border" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
                <Button variant="outline" type="button" onClick={handleMockGoogleLogin} className="w-full flex items-center justify-center">
                    <FcGoogle className="mr-2 h-4 w-4" />
                    Google
                </Button>
                <Button variant="outline" type="button" onClick={handleMockGoogleLogin} className="w-full justify-center text-blue-600 flex items-center">
                    <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
                    Facebook
                </Button>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
                {t('auth.dontHaveAccount')}{" "}
                <Link to="/register" className="font-semibold text-emerald-600 hover:underline">
                    {t('auth.registerNow')}
                </Link>
            </p>
        </div>
    )
}
