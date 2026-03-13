import { useFormik } from "formik"
import * as Yup from "yup"
import { useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { registerUser } from "@/features/auth/authSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff, Mail, Lock, User } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

export function RegisterPage() {
    const { t } = useTranslation()

    // Validation Schema
    const RegisterSchema = Yup.object().shape({
        name: Yup.string().required(t('auth.nameRequired')),
        email: Yup.string().email(t('auth.emailInvalid')).required(t('auth.emailRequired')),
        password: Yup.string().required(t('auth.passwordRequired')),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref('password'), null], t('auth.passwordMismatch'))
            .required(t('auth.confirmPasswordRequired')),
    })

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const formik = useFormik({
        initialValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        validationSchema: RegisterSchema,
        onSubmit: async (values) => {
            setIsLoading(true);
            try {
                // Call real backend registration
                await dispatch(registerUser({
                    name: values.name,
                    email: values.email,
                    password: values.password
                })).unwrap();

                toast.success(t('auth.registerSuccess'));
                navigate("/");
            } catch (error) {
                toast.error(error || t('auth.registerFailed', 'Đăng ký không thành công, email có thể đã tồn tại'));
            } finally {
                setIsLoading(false);
            }
        },
    })

    const handleMockGoogleLogin = () => {
        toast.info(t('auth.socialRegisterComingSoon'));
    }

    return (
        <div className="w-full">
            <div className="mb-8 text-center sm:text-left">
                <h2 className="text-3xl font-bold tracking-tight">{t('auth.registerTitle')}</h2>
                <p className="text-muted-foreground mt-2">
                    {t('auth.registerDesc')}
                </p>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t('auth.displayName')}</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="name"
                            placeholder={t('auth.namePlaceholder')}
                            className="pl-9"
                            {...formik.getFieldProps("name")}
                        />
                    </div>
                    {formik.touched.name && formik.errors.name && (
                        <p className="text-sm text-red-500">{formik.errors.name}</p>
                    )}
                </div>

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
                    <Label htmlFor="password">{t('auth.password')}</Label>
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

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder={t('auth.passwordPlaceholder')}
                            className="pl-9 pr-10"
                            {...formik.getFieldProps("confirmPassword")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                        <p className="text-sm text-red-500">{formik.errors.confirmPassword}</p>
                    )}
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.createAccountBtn')}
                </Button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-4">
                <span className="h-px w-full bg-border" />
                <span className="text-xs text-muted-foreground uppercase whitespace-nowrap">{t('auth.orRegisterWith')}</span>
                <span className="h-px w-full bg-border" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
                <Button variant="outline" type="button" onClick={handleMockGoogleLogin} className="w-full">
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                </Button>
                <Button variant="outline" type="button" onClick={handleMockGoogleLogin} className="w-full justify-center text-blue-600">
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                </Button>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
                {t('auth.alreadyHaveAccount')}{" "}
                <Link to="/login" className="font-semibold text-emerald-600 hover:underline">
                    {t('auth.loginLink')}
                </Link>
            </p>
        </div>
    )
}
