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
import { FcGoogle } from "react-icons/fc"
import { FaFacebook } from "react-icons/fa"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { resolveAuthError } from "@/utils/authErrors"

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
                await dispatch(registerUser({
                    name: values.name,
                    email: values.email,
                    password: values.password
                })).unwrap();

                toast.success(t('auth.registerSuccess'));
                navigate("/");
            } catch (error) {
                toast.error(resolveAuthError(error, t, 'auth.registerFailed'));
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
                {t('auth.alreadyHaveAccount')}{" "}
                <Link to="/login" className="font-semibold text-emerald-600 hover:underline">
                    {t('auth.loginLink')}
                </Link>
            </p>
        </div>
    )
}
