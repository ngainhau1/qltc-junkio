
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
import { addFamily } from "@/features/families/familySlice"
import { setWallets } from "@/features/wallets/walletSlice"
import { setTransactions } from "@/features/transactions/transactionSlice"
import { FakerService } from "@/services/fakerService"

// Validation Schema
const RegisterSchema = Yup.object().shape({
    name: Yup.string().required("Vui lòng nhập tên hiển thị"),
    email: Yup.string().email("Email không hợp lệ").required("Vui lòng nhập Email"),
    password: Yup.string().min(6, "Mật khẩu tối thiểu 6 ký tự").required("Vui lòng nhập mật khẩu"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Mật khẩu không khớp')
        .required('Vui lòng xác nhận mật khẩu'),
})

export function RegisterPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const formik = useFormik({
        initialValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        validationSchema: RegisterSchema,
        onSubmit: async (values) => {
            setIsLoading(true)
            // Simulator Register Logic:
            // 1. Create User
            // 2. Seed Data for new user
            setTimeout(() => {
                const newUser = {
                    id: `u-${Date.now()}`,
                    name: values.name,
                    email: values.email,
                    role: 'member'
                }

                // Seed data for this new user
                const data = FakerService.initData(newUser.id)

                // Update Store
                dispatch(login(newUser))
                dispatch(setWallets(data.wallets))
                dispatch(setTransactions(data.transactions))
                if (data.family) dispatch(addFamily(data.family))

                toast.success("Đăng ký thành công! Đã tạo dữ liệu mẫu.")
                navigate("/")
                setIsLoading(false)
            }, 1500)
        },
    })

    return (
        <Card className="w-full shadow-lg border-zinc-200 dark:border-zinc-800">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight">Đăng Ký</CardTitle>
                <CardDescription>
                    Tạo tài khoản mới và bắt đầu quản lý chi tiêu.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={formik.handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Tên hiển thị</Label>
                        <Input
                            id="name"
                            placeholder="Nguyễn Văn A"
                            {...formik.getFieldProps("name")}
                        />
                        {formik.touched.name && formik.errors.name && (
                            <p className="text-sm text-red-500">{formik.errors.name}</p>
                        )}
                    </div>
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
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            {...formik.getFieldProps("confirmPassword")}
                        />
                        {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                            <p className="text-sm text-red-500">{formik.errors.confirmPassword}</p>
                        )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Đăng Ký
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link to="/login" className="ml-1 font-medium text-primary hover:underline">
                    Đăng nhập
                </Link>
            </CardFooter>
        </Card>
    )
}
