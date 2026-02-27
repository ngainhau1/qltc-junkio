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
import { useTranslation } from "react-i18next"

export function Settings() {
    const { t } = useTranslation();
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
                <p className="text-muted-foreground mt-2">{t('settings.subtitle')}</p>
            </div>

            {/* Sidebar Desktop Layout */}
            <Tabs defaultValue="appearance" className="flex flex-col md:flex-row gap-6 mt-8">
                {/* Left Navigation */}
                <TabsList className="flex flex-col h-auto bg-transparent items-stretch justify-start space-y-1 w-full md:w-[250px] shrink-0 p-0 font-medium">
                    <TabsTrigger value="appearance" className="justify-start px-4 py-2.5 data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-md transition-colors hover:bg-muted/50">
                        <Settings2 className="w-4 h-4 mr-2" />
                        {t('settings.tabs.appearance')}
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="justify-start px-4 py-2.5 data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-md transition-colors hover:bg-muted/50">
                        <Bell className="w-4 h-4 mr-2" />
                        {t('settings.tabs.notifications')}
                    </TabsTrigger>
                    <TabsTrigger value="data" className="justify-start px-4 py-2.5 data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-md transition-colors hover:bg-muted/50">
                        <Database className="w-4 h-4 mr-2" />
                        {t('settings.tabs.data')}
                    </TabsTrigger>
                    <TabsTrigger value="account" className="justify-start px-4 py-2.5 text-destructive data-[state=active]:text-destructive data-[state=active]:bg-destructive/10 data-[state=active]:shadow-none rounded-md transition-colors hover:bg-destructive/5 hover:text-destructive">
                        <Shield className="w-4 h-4 mr-2" />
                        {t('settings.tabs.account')}
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
    const { t } = useTranslation();
    const { setTheme, theme } = useTheme()
    const dispatch = useDispatch()
    const { currency, language } = useSelector(state => state.settings)

    return (
        <Card className="shadow-none border-muted/60">
            <CardHeader>
                <CardTitle>{t('settings.appearance.title')}</CardTitle>
                <CardDescription>{t('settings.appearance.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Theme Selector */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold">{t('settings.appearance.themeTitle')}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-accent/50 ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-muted'}`}
                            onClick={() => setTheme("light")}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <Sun className="h-6 w-6" />
                                <span className="font-medium text-sm">{t('settings.appearance.themeLight')}</span>
                            </div>
                        </div>
                        <div
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-accent/50 ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-muted'}`}
                            onClick={() => setTheme("dark")}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <Moon className="h-6 w-6" />
                                <span className="font-medium text-sm">{t('settings.appearance.themeDark')}</span>
                            </div>
                        </div>
                        <div
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-accent/50 ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-muted'}`}
                            onClick={() => setTheme("system")}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <Laptop className="h-6 w-6" />
                                <span className="font-medium text-sm">{t('settings.appearance.themeSystem')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border/50"></div>

                {/* Currency & Language */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <div>
                            <Label className="text-base font-semibold">{t('settings.appearance.currencyTitle')}</Label>
                            <p className="text-sm text-muted-foreground mt-1 mb-3">{t('settings.appearance.currencyDesc')}</p>
                        </div>
                        <Select value={currency} onValueChange={(val) => dispatch(updateCurrency(val))}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('settings.appearance.currencyPlaceholder')} />
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
                            <Label className="text-base font-semibold">{t('settings.appearance.langTitle')}</Label>
                            <p className="text-sm text-muted-foreground mt-1 mb-3">{t('settings.appearance.langDesc')}</p>
                        </div>
                        <Select value={language} onValueChange={(val) => dispatch(updateLanguage(val))}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('settings.appearance.langPlaceholder')} />
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
    const { t } = useTranslation();
    const dispatch = useDispatch()
    const { notifications } = useSelector(state => state.settings)

    const handleToggle = (key) => {
        dispatch(toggleNotification({ key, value: !notifications[key] }))
    }

    return (
        <Card className="shadow-none border-muted/60">
            <CardHeader>
                <CardTitle>{t('settings.notifications.title')}</CardTitle>
                <CardDescription>{t('settings.notifications.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">{t('settings.notifications.debtTitle')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.notifications.debtDesc')}</p>
                    </div>
                    <Switch
                        checked={notifications?.debtReminders}
                        onCheckedChange={() => handleToggle('debtReminders')}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">{t('settings.notifications.budgetTitle')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.notifications.budgetDesc')}</p>
                    </div>
                    <Switch
                        checked={notifications?.budgetAlerts}
                        onCheckedChange={() => handleToggle('budgetAlerts')}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">{t('settings.notifications.weeklyTitle')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.notifications.weeklyDesc')}</p>
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
    const { t } = useTranslation();
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

        toast.success(t('settings.data.backupSuccess'))
    }

    const handleImportPlaceholder = () => {
        toast.info(t('settings.data.importNotice'))
    }

    const confirmHardReset = () => {
        localStorage.clear()
        window.location.reload()
    }

    return (
        <Card className="shadow-none border-muted/60">
            <CardHeader>
                <CardTitle>{t('settings.data.title')}</CardTitle>
                <CardDescription>{t('settings.data.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base font-semibold">{t('settings.data.backupTitle')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.data.backupDesc')}</p>
                    </div>
                    <Button onClick={handleBackup} className="w-full sm:w-auto h-10 px-6">
                        <Download className="mr-2 h-4 w-4" /> {t('settings.data.backupBtn')}
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">{t('settings.data.importTitle')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.data.importDesc')}</p>
                    </div>
                    <Button variant="outline" onClick={handleImportPlaceholder} className="w-full sm:w-auto h-10 px-5">
                        <Upload className="mr-2 h-4 w-4" /> {t('settings.data.importBtn')}
                    </Button>
                </div>

                <div className="border-t border-border/50 my-6"></div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 mt-6">
                    <div className="space-y-1">
                        <Label className="text-base text-destructive font-semibold">{t('settings.data.resetTitle')}</Label>
                        <p className="text-sm text-muted-foreground max-w-sm">{t('settings.data.resetDesc')}</p>
                    </div>
                    <Button variant="destructive" onClick={() => setIsResetModalOpen(true)} className="w-full sm:w-auto mt-2 sm:mt-0 font-medium">
                        <Trash2 className="mr-2 h-4 w-4" /> {t('settings.data.resetBtn')}
                    </Button>
                </div>
            </CardContent>

            <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title={t('settings.data.resetModalTitle')}>
                <div className="py-4">
                    <div className="flex items-center gap-3 text-destructive mb-3">
                        <AlertTriangle className="h-6 w-6" />
                        <h4 className="font-semibold text-lg">{t('settings.data.resetModalQ')}</h4>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {t('settings.data.resetModalDesc1')}<b>{t('settings.data.resetModalDescStrong')}</b>{t('settings.data.resetModalDesc2')}
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                        {t('settings.data.resetModalDesc3')}
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => setIsResetModalOpen(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="destructive" onClick={confirmHardReset}>
                        <Trash2 className="mr-2 h-4 w-4" /> {t('settings.data.resetModalConfirm')}
                    </Button>
                </div>
            </Modal>
        </Card>
    )
}

function AccountSettings() {
    const { t } = useTranslation();
    const dispatch = useDispatch()
    const { user } = useSelector(state => state.auth)
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const confirmLogout = () => {
        dispatch(logout())
        toast.success(t('settings.account.logoutSuccess'))
        setIsLogoutModalOpen(false);
    }

    return (
        <Card className="shadow-none border-muted/60">
            <CardHeader className="pb-4">
                <CardTitle>{t('settings.account.title')}</CardTitle>
                <CardDescription>{t('settings.account.desc')} ({user?.email || 'N/A'}).</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                    <div className="space-y-1 max-w-[80%]">
                        <Label className="text-base font-semibold text-destructive">{t('settings.account.logoutTitle')}</Label>
                        <p className="text-sm text-muted-foreground">
                            {t('settings.account.logoutDesc')}
                        </p>
                    </div>
                    <Button variant="destructive" onClick={() => setIsLogoutModalOpen(true)} className="w-full lg:w-auto shrink-0 shadow-sm shadow-destructive/20">
                        <LogOut className="mr-2 h-4 w-4" /> {t('settings.account.logoutBtn')}
                    </Button>
                </div>
            </CardContent>

            <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title={t('settings.account.logoutModalTitle')}>
                <div className="py-2 pb-6">
                    <p className="text-muted-foreground">
                        {t('settings.account.logoutModalQ')}
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 border-t pt-4">
                    <Button variant="outline" onClick={() => setIsLogoutModalOpen(false)}>
                        {t('settings.account.stayBtn')}
                    </Button>
                    <Button variant="destructive" onClick={confirmLogout}>
                        {t('settings.account.logoutConfirmBtn')}
                    </Button>
                </div>
            </Modal>
        </Card>
    )
}
