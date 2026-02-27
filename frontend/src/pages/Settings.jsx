import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun, Laptop, Download, Trash2, LogOut, Upload, Settings2, Bell, Database, Shield, AlertTriangle } from "lucide-react"
import { useSelector, useDispatch } from "react-redux"
import { toast } from "sonner"
import { store } from "@/store"
import { logout } from "@/features/auth/authSlice"
import { updateCurrency, updateLanguage, toggleNotification } from "@/features/settings/settingsSlice"
import { useState } from "react"
import { Modal } from "@/components/ui/modal"

export function Settings() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Cài Đặt</h1>
                <p className="text-muted-foreground mt-2">Quản lý giao diện, hiển thị, hệ thống và tài khoản của bạn.</p>
            </div>

            {/* Sidebar Desktop Layout */}
            <Tabs defaultValue="appearance" className="flex flex-col md:flex-row gap-6 mt-8">
                {/* Left Navigation */}
                <TabsList className="flex flex-col h-auto bg-transparent items-stretch justify-start space-y-1 w-full md:w-[250px] shrink-0 p-0 font-medium">
                    <TabsTrigger value="appearance" className="justify-start px-4 py-2.5 data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-md transition-colors hover:bg-muted/50">
                        <Settings2 className="w-4 h-4 mr-2" />
                        Giao Diện & Ký Hiệu
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="justify-start px-4 py-2.5 data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-md transition-colors hover:bg-muted/50">
                        <Bell className="w-4 h-4 mr-2" />
                        Thông Báo
                    </TabsTrigger>
                    <TabsTrigger value="data" className="justify-start px-4 py-2.5 data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-md transition-colors hover:bg-muted/50">
                        <Database className="w-4 h-4 mr-2" />
                        Dữ Liệu Hệ Thống
                    </TabsTrigger>
                    <TabsTrigger value="account" className="justify-start px-4 py-2.5 text-destructive data-[state=active]:text-destructive data-[state=active]:bg-destructive/10 data-[state=active]:shadow-none rounded-md transition-colors hover:bg-destructive/5 hover:text-destructive">
                        <Shield className="w-4 h-4 mr-2" />
                        Tài Khoản & Bảo Mật
                    </TabsTrigger>
                </TabsList>

                {/* Right Content */}
                <div className="flex-1 w-full min-w-0">
                    <TabsContent value="appearance" className="m-0 space-y-6">
                        <AppearanceSettings />
                    </TabsContent>

                    <TabsContent value="notifications" className="m-0 space-y-6">
                        <NotificationSettings />
                    </TabsContent>

                    <TabsContent value="data" className="m-0 space-y-6">
                        <DataSettings />
                    </TabsContent>

                    <TabsContent value="account" className="m-0 space-y-6">
                        <AccountSettings />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

function AppearanceSettings() {
    const { setTheme, theme } = useTheme()
    const dispatch = useDispatch()
    const { currency, language } = useSelector(state => state.settings)

    return (
        <Card className="shadow-none border-muted/60">
            <CardHeader>
                <CardTitle>Hiển thị & Giao diện</CardTitle>
                <CardDescription>Cá nhân hóa trải nghiệm sử dụng ứng dụng.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Theme Selector */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold">Chủ Màu (Theme)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-accent/50 ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-muted'}`}
                            onClick={() => setTheme("light")}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <Sun className="h-6 w-6" />
                                <span className="font-medium text-sm">Giao diện Sáng</span>
                            </div>
                        </div>
                        <div
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-accent/50 ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-muted'}`}
                            onClick={() => setTheme("dark")}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <Moon className="h-6 w-6" />
                                <span className="font-medium text-sm">Giao diện Tối</span>
                            </div>
                        </div>
                        <div
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-accent/50 ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-muted'}`}
                            onClick={() => setTheme("system")}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <Laptop className="h-6 w-6" />
                                <span className="font-medium text-sm">Tự động (Hệ thống)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border/50"></div>

                {/* Currency & Language */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <div>
                            <Label className="text-base font-semibold">Tiền tệ & Ký hiệu</Label>
                            <p className="text-sm text-muted-foreground mt-1 mb-3">Tất cả giao dịch sẽ hiển thị với ký hiệu này.</p>
                        </div>
                        <Select value={currency} onValueChange={(val) => dispatch(updateCurrency(val))}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn tiền tệ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="VND">Tiền Việt (₫)</SelectItem>
                                <SelectItem value="USD">Dollar Mỹ ($)</SelectItem>
                                {/* Thêm ngoại tệ khác nếu cần */}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <Label className="text-base font-semibold">Ngôn ngữ Ưu tiên</Label>
                            <p className="text-sm text-muted-foreground mt-1 mb-3">Ngôn ngữ giao diện (Đang hiển thị dạng giả lập).</p>
                        </div>
                        <Select value={language} onValueChange={(val) => dispatch(updateLanguage(val))}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn ngôn ngữ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vi">Tiếng Việt (Vietnamese)</SelectItem>
                                <SelectItem value="en">Tiếng Anh (English)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function NotificationSettings() {
    const dispatch = useDispatch()
    const { notifications } = useSelector(state => state.settings)

    const handleToggle = (key) => {
        dispatch(toggleNotification({ key, value: !notifications[key] }))
    }

    return (
        <Card className="shadow-none border-muted/60">
            <CardHeader>
                <CardTitle>Cài Đặt Thông Báo</CardTitle>
                <CardDescription>Quản lý các sự kiện nào sẽ gửi cảnh báo đến bạn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Nhắc Nhở Nợ & Thanh Toán</Label>
                        <p className="text-sm text-muted-foreground">Nhận thông báo khi tới hạn chót thanh toán hóa đơn hoặc trả nợ.</p>
                    </div>
                    <Switch
                        checked={notifications?.debtReminders}
                        onCheckedChange={() => handleToggle('debtReminders')}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Cảnh Báo Vượt Ngân Sách</Label>
                        <p className="text-sm text-muted-foreground">Báo động đỏ khi bạn tiêu quá số tiền đã hoạch định cho một hạng mục.</p>
                    </div>
                    <Switch
                        checked={notifications?.budgetAlerts}
                        onCheckedChange={() => handleToggle('budgetAlerts')}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Báo Cáo Chi Tiêu Hàng Tuần</Label>
                        <p className="text-sm text-muted-foreground">Gửi bản tóm tắt tình hình tài chính vào Chủ Nhật hàng tuần qua email.</p>
                    </div>
                    <Switch
                        checked={notifications?.weeklyReports}
                        onCheckedChange={() => handleToggle('weeklyReports')}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

function DataSettings() {
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const handleBackup = () => {
        const state = store.getState()
        const data = {
            wallets: state.wallets.wallets,
            transactions: state.transactions.transactions,
            families: state.families.families,
            recurringRules: state.recurring.rules,
            settings: state.settings // Lấy luôn cả settings hiện tại
        }

        const json = JSON.stringify(data, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `backup_junkio_${new Date().toISOString().split('T')[0]}.json`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success("Đã phân loại & tải xuống tệp dữ liệu backup.")
    }

    const handleImportPlaceholder = () => {
        toast.info("Tính năng nhận tệp Backup JSON đang được phát triển.")
    }

    const confirmHardReset = () => {
        localStorage.clear()
        window.location.reload()
    }

    return (
        <Card className="shadow-none border-muted/60">
            <CardHeader>
                <CardTitle>Lưu Trữ & Khôi Phục</CardTitle>
                <CardDescription>Kiểm soát toàn bộ kho dữ liệu cục bộ của ứng dụng.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Xuất Phục Hồi (Backup Data)</Label>
                        <p className="text-sm text-muted-foreground">Tải xuống toàn bộ tài sản, giao dịch dưới định dạng tệp .json an toàn.</p>
                    </div>
                    <Button onClick={handleBackup} className="w-full sm:w-auto h-10 px-6">
                        <Download className="mr-2 h-4 w-4" /> Sao Lưu Ngay
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Nhập Dữ Liệu Cũ (Import)</Label>
                        <p className="text-sm text-muted-foreground">Nạp lại file backup .json nếu bạn mất dữ liệu, hoặc chuyển thiết bị.</p>
                    </div>
                    <Button variant="outline" onClick={handleImportPlaceholder} className="w-full sm:w-auto h-10 px-5">
                        <Upload className="mr-2 h-4 w-4" /> Tải Lên Tệp
                    </Button>
                </div>

                <div className="border-t border-border/50 my-6"></div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 mt-6">
                    <div className="space-y-1">
                        <Label className="text-base text-destructive font-semibold">Xoá Dữ Liệu Giả Lập (Hard Reset)</Label>
                        <p className="text-sm text-muted-foreground max-w-sm">Hành động này mang ý nghĩa format database, dùng trong trường hợp app bị lỗi cache. Sẽ mất sạch data chưa backup.</p>
                    </div>
                    <Button variant="destructive" onClick={() => setIsResetModalOpen(true)} className="w-full sm:w-auto mt-2 sm:mt-0 font-medium">
                        <Trash2 className="mr-2 h-4 w-4" /> Xoá Toàn Bộ Dữ Liệu
                    </Button>
                </div>
            </CardContent>

            <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Cảnh Báo Nguy Hiểm">
                <div className="py-4">
                    <div className="flex items-center gap-3 text-destructive mb-3">
                        <AlertTriangle className="h-6 w-6" />
                        <h4 className="font-semibold text-lg">Xóa vĩnh viễn dữ liệu thiết bị?</h4>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Toàn bộ <b>Giao dịch, Ví, Thông tin tài khoản</b> của bạn được lưu trong LocalStorage sẽ bị xóa sạch và KHÔNG THỂ KHÔI PHỤC được nếu chưa có file dữ liệu .json sao lưu.
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                        Ứng dụng sẽ tự động tải lại (Reload).
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => setIsResetModalOpen(false)}>
                        Hủy bỏ
                    </Button>
                    <Button variant="destructive" onClick={confirmHardReset}>
                        <Trash2 className="mr-2 h-4 w-4" /> Xác nhận Xóa
                    </Button>
                </div>
            </Modal>
        </Card>
    )
}

function AccountSettings() {
    const dispatch = useDispatch()
    const { user } = useSelector(state => state.auth)
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const confirmLogout = () => {
        dispatch(logout())
        toast.success("Đã kết thúc phiên bảo mật")
        setIsLogoutModalOpen(false);
    }

    return (
        <Card className="shadow-none border-muted/60">
            <CardHeader className="pb-4">
                <CardTitle>Tài Khoản & Phiên Đăng Nhập</CardTitle>
                <CardDescription>Thông tin trạng thái bảo mật của phiên ({user?.email || 'N/A'}).</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                    <div className="space-y-1 max-w-[80%]">
                        <Label className="text-base font-semibold text-destructive">Đăng Xuất Phiên Hiện Tại</Label>
                        <p className="text-sm text-muted-foreground">
                            Hành động này sẽ xóa Identity Token hiện tại, bạn cần phải nhập lại Email/Mật khẩu khi truy cập tiếp.
                        </p>
                    </div>
                    <Button variant="destructive" onClick={() => setIsLogoutModalOpen(true)} className="w-full lg:w-auto shrink-0 shadow-sm shadow-destructive/20">
                        <LogOut className="mr-2 h-4 w-4" /> An Toàn Đăng Xuất
                    </Button>
                </div>
            </CardContent>

            <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="Xác Nhận Hành Động">
                <div className="py-2 pb-6">
                    <p className="text-muted-foreground">
                        Bạn có chắc chắn muốn thoát khỏi tài khoản hệ thống của thiết bị này chứ?
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 border-t pt-4">
                    <Button variant="outline" onClick={() => setIsLogoutModalOpen(false)}>
                        Giữ tôi đăng nhập
                    </Button>
                    <Button variant="destructive" onClick={confirmLogout}>
                        Đăng Xuất
                    </Button>
                </div>
            </Modal>
        </Card>
    )
}
