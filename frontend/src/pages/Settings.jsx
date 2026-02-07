
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun, Laptop, Download, Trash2 } from "lucide-react"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import { store } from "@/store"

export function Settings() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Cài Đặt</h1>
                <p className="text-muted-foreground">Quản lý giao diện, dữ liệu và tài khoản của bạn.</p>
            </div>

            <Tabs defaultValue="appearance" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="appearance">Giao Diện</TabsTrigger>
                    <TabsTrigger value="data">Dữ Liệu</TabsTrigger>
                    <TabsTrigger value="profile">Hồ Sơ</TabsTrigger>
                </TabsList>

                <TabsContent value="appearance" className="space-y-4">
                    <AppearanceSettings />
                </TabsContent>

                <TabsContent value="data" className="space-y-4">
                    <DataSettings />
                </TabsContent>

                <TabsContent value="profile" className="space-y-4">
                    <ProfileSettings />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function AppearanceSettings() {
    const { setTheme, theme } = useTheme()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Giao Diện</CardTitle>
                <CardDescription>Tùy chỉnh giao diện ứng dụng theo sở thích của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div
                        className={`cursor-pointer rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${theme === 'light' ? 'border-primary' : 'border-muted'}`}
                        onClick={() => setTheme("light")}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Sun className="h-6 w-6" />
                            <span className="font-medium">Sáng</span>
                        </div>
                    </div>
                    <div
                        className={`cursor-pointer rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${theme === 'dark' ? 'border-primary' : 'border-muted'}`}
                        onClick={() => setTheme("dark")}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Moon className="h-6 w-6" />
                            <span className="font-medium">Tối</span>
                        </div>
                    </div>
                    <div
                        className={`cursor-pointer rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${theme === 'system' ? 'border-primary' : 'border-muted'}`}
                        onClick={() => setTheme("system")}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Laptop className="h-6 w-6" />
                            <span className="font-medium">Hệ Thống</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function DataSettings() {

    const handleBackup = () => {
        const state = store.getState()
        const data = {
            wallets: state.wallets.wallets,
            transactions: state.transactions.transactions,
            families: state.families.families,
            recurringRules: state.recurring.rules
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

        toast.success("Đã tải xuống file sao lưu dữ liệu.")
    }

    const handleHardReset = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu? Hành động này không thể hoàn tác!")) {
            localStorage.clear()
            window.location.reload()
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Quản Lý Dữ Liệu</CardTitle>
                <CardDescription>Sao lưu, khôi phục hoặc đặt lại dữ liệu ứng dụng.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Sao Lưu Dữ Liệu (Backup)</Label>
                        <p className="text-sm text-muted-foreground">Tải xuống toàn bộ dữ liệu hiện tại dưới dạng file JSON.</p>
                    </div>
                    <Button variant="outline" onClick={handleBackup}>
                        <Download className="mr-2 h-4 w-4" /> Tải Xuống
                    </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4 border-destructive/50 bg-destructive/10">
                    <div className="space-y-0.5">
                        <Label className="text-base text-destructive">Xóa Dữ Liệu (Hard Reset)</Label>
                        <p className="text-sm text-muted-foreground">Xóa toàn bộ dữ liệu cục bộ và đưa ứng dụng về trạng thái ban đầu.</p>
                    </div>
                    <Button variant="destructive" onClick={handleHardReset}>
                        <Trash2 className="mr-2 h-4 w-4" /> Reset App
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function ProfileSettings() {
    const { user } = useSelector(state => state.auth)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Hồ Sơ Của Tôi</CardTitle>
                <CardDescription>Thông tin tài khoản (Chế độ Frontend - Giả lập).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Tên hiển thị</Label>
                        <Input id="name" defaultValue={user?.name || "Người dùng Demo"} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" defaultValue={user?.email || "demo@junkio.com"} disabled />
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button disabled>Lưu Thay Đổi (Backend Required)</Button>
                </div>
            </CardContent>
        </Card>
    )
}
