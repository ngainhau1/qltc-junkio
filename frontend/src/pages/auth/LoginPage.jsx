
import { useFormik } from "formik"
import * as Yup from "yup"
import { useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { login } from "@/features/auth/authSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useState } from "react"

// Validation Schema
const LoginSchema = Yup.object().shape({
    email: Yup.string().email("Email không hợp lệ").required("Vui lòng nhập Email"),
    password: Yup.string().min(6, "Mật khẩu tối thiểu 6 ký tự").required("Vui lòng nhập mật khẩu"),
})

export function LoginPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const formik = useFormik({
        initialValues: {
            email: "demo@junkio.com",
            password: "password123",
        },
        validationSchema: LoginSchema,
        onSubmit: async (values) => {
            setIsLoading(true)
            // Simulator API Call delay
            setTimeout(() => {
                const mockUser = { id: 'u-1', name: 'Demo User', email: values.email }
                dispatch(login(mockUser))
                toast.success("Đăng nhập thành công!")
                navigate("/") // Redirect to Dashboard
                setIsLoading(false)
            }, 1000)
        },
    })

    return (
        <Card className="w-full shadow-lg border-zinc-200 dark:border-zinc-800">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight">Đăng Nhập</CardTitle>
                <CardDescription>
                    Nhập email và mật khẩu để truy cập tài khoản của bạn.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={formik.handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            {...formik.getFieldProps("email")}
                        />
                        {formik.touched.email && formik.errors.email && (
                            <p className="text-sm text-red-500">{formik.errors.email}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Mật khẩu</Label>
                        <Input
                            id="password"
                            type="password"
                            {...formik.getFieldProps("password")}
                        />
                        {formik.touched.password && formik.errors.password && (
                            <p className="text-sm text-red-500">{formik.errors.password}</p>
                        )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Đăng Nhập
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center text-sm text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Link to="/register" className="ml-1 font-medium text-primary hover:underline">
                    Đăng ký ngay
                </Link>
            </CardFooter>
        </Card>
    )
}
