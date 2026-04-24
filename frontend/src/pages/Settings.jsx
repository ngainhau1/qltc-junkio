import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun, Laptop, Download, Trash2, LogOut, Upload, Settings2, Bell, Database, Shield, AlertTriangle, HelpCircle, ExternalLink, Github, Mail, Info } from "lucide-react"
import { useSelector, useDispatch } from "react-redux"
import { toast } from "sonner"
import { store } from "@/store"
import { logout } from "@/features/auth/authSlice"
import { updateCurrency, updateLanguage, toggleNotification, resetSettings } from "@/features/settings/settingsSlice"
import api from "@/lib/api"
import { Modal } from "@/components/ui/modal"
import { useTranslation } from "react-i18next"
import { extractErrorCode, resolveError } from "@/utils/authErrors"

export function Settings() {
    const { t } = useTranslation();
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('settings.title')}</h1>
                <p className="text-muted-foreground mt-2">{t('settings.subtitle')}</p>
            </div>

            {/* Sidebar Desktop Layout */}
            <Tabs defaultValue="appearance" className="mt-8 flex flex-col gap-6 md:flex-row">
                {/* Left Navigation */}
                <TabsList className="scrollbar-hidden flex h-auto w-full items-stretch justify-start gap-1 overflow-x-auto bg-transparent p-0 font-medium md:w-[250px] md:flex-col md:overflow-visible">
                    <TabsTrigger value="appearance" className="touch-target shrink-0 justify-start rounded-md px-4 py-2.5 data-[state=active]:bg-muted data-[state=active]:shadow-none transition-colors hover:bg-muted/50">
                        <Settings2 className="w-4 h-4 mr-2" />
                        {t('settings.tabs.appearance')}
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="touch-target shrink-0 justify-start rounded-md px-4 py-2.5 data-[state=active]:bg-muted data-[state=active]:shadow-none transition-colors hover:bg-muted/50">
                        <Bell className="w-4 h-4 mr-2" />
                        {t('settings.tabs.notifications')}
                    </TabsTrigger>
                    <TabsTrigger value="data" className="touch-target shrink-0 justify-start rounded-md px-4 py-2.5 data-[state=active]:bg-muted data-[state=active]:shadow-none transition-colors hover:bg-muted/50">
                        <Database className="w-4 h-4 mr-2" />
                        {t('settings.tabs.data')}
                    </TabsTrigger>
                    <TabsTrigger value="account" className="touch-target shrink-0 justify-start rounded-md px-4 py-2.5 text-destructive data-[state=active]:text-destructive data-[state=active]:bg-destructive/10 data-[state=active]:shadow-none transition-colors hover:bg-destructive/5 hover:text-destructive">
                        <Shield className="w-4 h-4 mr-2" />
                        {t('settings.tabs.account')}
                    </TabsTrigger>
                    <TabsTrigger value="support" className="touch-target shrink-0 justify-start rounded-md px-4 py-2.5 data-[state=active]:bg-muted data-[state=active]:shadow-none transition-colors hover:bg-muted/50">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        {t('settings.tabs.support')}
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

                    <TabsContent value="support" className="m-0 space-y-6">
                        <SupportSettings />
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
                                <SelectItem value="VND">{t('settings.appearance.currencyVND')}</SelectItem>
                                <SelectItem value="USD">{t('settings.appearance.currencyUSD')}</SelectItem>
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
                                <SelectItem value="vi">{t('settings.appearance.langVi')}</SelectItem>
                                <SelectItem value="en">{t('settings.appearance.langEn')}</SelectItem>
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
                <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:space-x-2">
                    <div className="space-y-0.5">
                        <Label className="text-base">{t('settings.notifications.debtTitle')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.notifications.debtDesc')}</p>
                    </div>
                    <Switch
                        checked={notifications?.debtReminders}
                        onCheckedChange={() => handleToggle('debtReminders')}
                    />
                </div>

                <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:space-x-2">
                    <div className="space-y-0.5">
                        <Label className="text-base">{t('settings.notifications.budgetTitle')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.notifications.budgetDesc')}</p>
                    </div>
                    <Switch
                        checked={notifications?.budgetAlerts}
                        onCheckedChange={() => handleToggle('budgetAlerts')}
                    />
                </div>

                <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:space-x-2">
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
    const dispatch = useDispatch();
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importData, setImportData] = useState(null);
    const [importFileName, setImportFileName] = useState('');
    const fileInputRef = React.useRef(null);

    const handleBackup = () => {
        const state = store.getState()
        const data = {
            wallets: state.wallets.wallets,
            transactions: state.transactions.transactions,
            families: state.families.families,
            recurringRules: state.recurring.rules,
            settings: state.settings
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

    const handleImportFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.endsWith('.json')) {
            toast.error(t('settings.data.importInvalidType'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(evt.target.result);
                if (typeof parsed !== 'object' || parsed === null) {
                    toast.error(t('settings.data.importInvalidFormat'));
                    return;
                }
                setImportData(parsed);
                setImportFileName(file.name);
                setIsImportModalOpen(true);
            } catch {
                toast.error(t('settings.data.importInvalidFormat'));
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const confirmImport = () => {
        if (!importData) return;
        if (importData.settings) {
            if (importData.settings.currency) dispatch(updateCurrency(importData.settings.currency));
            if (importData.settings.language) dispatch(updateLanguage(importData.settings.language));
        }
        toast.success(t('settings.data.importSuccess'));
        setIsImportModalOpen(false);
        setImportData(null);
    };

    const confirmHardReset = () => {
        dispatch(resetSettings());
        toast.success(t('settings.data.resetSuccess'));
        setIsResetModalOpen(false);
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
                    <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto h-10 px-5">
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
                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => setIsResetModalOpen(false)} className="w-full sm:w-auto">
                        {t('common.cancel')}
                    </Button>
                    <Button variant="destructive" onClick={confirmHardReset} className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" /> {t('settings.data.resetModalConfirm')}
                    </Button>
                </div>
            </Modal>

            {/* Import Confirmation Modal */}
            <Modal isOpen={isImportModalOpen} onClose={() => { setIsImportModalOpen(false); setImportData(null); }} title={t('settings.data.importModalTitle')}>
                <div className="py-4 space-y-3">
                    <p className="text-sm text-muted-foreground">{t('settings.data.importModalDesc')}</p>
                    {importFileName && (
                        <div className="rounded-lg border bg-muted/50 p-3">
                            <p className="text-sm font-medium">{importFileName}</p>
                            {importData && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {Object.keys(importData).length} {t('settings.data.importModalKeys')}
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => { setIsImportModalOpen(false); setImportData(null); }} className="w-full sm:w-auto">
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={confirmImport} className="w-full sm:w-auto">
                        <Upload className="mr-2 h-4 w-4" /> {t('settings.data.importConfirmBtn')}
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

    // Password strength
    const [newPasswordValue, setNewPasswordValue] = useState('');
    const getPasswordStrength = (pwd) => {
        let score = 0;
        if (pwd.length >= 6) score++;
        if (pwd.length >= 10) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        if (score <= 1) return { level: 0, label: t('settings.account.strengthWeak'), color: 'bg-red-500' };
        if (score <= 2) return { level: 1, label: t('settings.account.strengthMedium'), color: 'bg-orange-500' };
        if (score <= 3) return { level: 2, label: t('settings.account.strengthStrong'), color: 'bg-green-500' };
        return { level: 3, label: t('settings.account.strengthVeryStrong'), color: 'bg-blue-500' };
    };
    const passwordStrength = newPasswordValue ? getPasswordStrength(newPasswordValue) : null;

    // Delete account states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Broadcast states
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [isSending, setIsSending] = useState(false);

    const confirmLogout = () => {
        dispatch(logout())
        toast.success(t('settings.account.logoutSuccess'))
        setIsLogoutModalOpen(false);
    }

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!broadcastMsg.trim()) return toast.error(t('settings.account.broadcastEmpty'));
        setIsSending(true);
        try {
            await api.post('/notifications/broadcast', {
                title: broadcastTitle,
                message: broadcastMsg,
                type: 'SYSTEM'
            });
            toast.success(t('settings.account.broadcastSuccess'));
            setBroadcastTitle('');
            setBroadcastMsg('');
        } catch (error) {
            toast.error(resolveError(extractErrorCode(error), t, 'settings.account.broadcastFailed'));
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card className="shadow-none border-muted/60">
            <CardHeader className="pb-4">
                <CardTitle>{t('settings.account.title')}</CardTitle>
                <CardDescription>{t('settings.account.desc')} ({user?.email || 'N/A'}).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Change Password Area */}
                <div className="rounded-xl border p-5 space-y-4">
                    <div className="space-y-1">
                        <Label className="text-base font-semibold">{t('settings.account.changePasswordTitle')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.account.changePasswordDesc')}</p>
                    </div>
                    <form className="space-y-4 max-w-sm" onSubmit={async (e) => {
                        e.preventDefault();
                        const currentPassword = e.target.currentPassword.value;
                        const newPassword = e.target.newPassword.value;
                        const confirmPassword = e.target.confirmPassword.value;

                        if (!currentPassword || !newPassword || !confirmPassword) {
                            return toast.error(t('settings.account.fillAllFields'));
                        }
                        if (newPassword !== confirmPassword) {
                            return toast.error(t('settings.account.passwordConfirmMismatch'));
                        }
                        
                        try {
                            await api.put('/users/me/password', { currentPassword, newPassword });
                            toast.success(t('settings.account.passwordUpdateSuccess'));
                            e.target.reset();
                        } catch (error) {
                            toast.error(resolveError(extractErrorCode(error), t, 'settings.account.passwordUpdateFailed'));
                        }
                    }}>
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">{t('settings.account.currentPassword')}</Label>
                            <Input id="currentPassword" type="password" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">{t('settings.account.newPassword')}</Label>
                            <Input id="newPassword" type="password" required minLength="6" value={newPasswordValue} onChange={(e) => setNewPasswordValue(e.target.value)} />
                            {passwordStrength && (
                                <div className="space-y-1.5">
                                    <div className="flex gap-1">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= passwordStrength.level ? passwordStrength.color : 'bg-muted'}`} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{passwordStrength.label}</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">{t('settings.account.confirmNewPassword')}</Label>
                            <Input id="confirmPassword" type="password" required minLength="6" />
                        </div>
                        <Button type="submit">{t('settings.account.updatePasswordBtn')}</Button>
                    </form>
                </div>

                {/* Logout Area */}
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-5 lg:flex-row lg:items-center">
                    <div className="space-y-1">
                        <Label className="text-base font-semibold text-destructive">{t('settings.account.logoutTitle')}</Label>
                        <p className="text-sm text-muted-foreground">
                            {t('settings.account.logoutDesc')}
                        </p>
                    </div>
                    <Button variant="destructive" onClick={() => setIsLogoutModalOpen(true)} className="w-full lg:w-auto shrink-0 shadow-sm shadow-destructive/20">
                        <LogOut className="mr-2 h-4 w-4" /> {t('settings.account.logoutBtn')}
                    </Button>
                </div>

                {/* Delete Account Area */}
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-destructive/40 bg-destructive/10 p-5 lg:flex-row lg:items-center">
                    <div className="space-y-1">
                        <Label className="text-base font-semibold text-destructive flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {t('settings.account.deleteTitle')}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            {t('settings.account.deleteDesc')}
                        </p>
                    </div>
                    <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)} className="w-full lg:w-auto shrink-0 shadow-sm shadow-destructive/20">
                        <Trash2 className="mr-2 h-4 w-4" /> {t('settings.account.deleteBtn')}
                    </Button>
                </div>
            </CardContent>

            {/* Admin Area */}
            {user?.role === 'admin' && (
                <>
                    <div className="border-t border-border/50 my-6 mx-6"></div>
                    <CardHeader className="pt-0">
                        <CardTitle className="text-xl text-primary flex items-center gap-2">
                            <Shield className="w-5 h-5" /> {t('settings.account.broadcastTitle')}
                        </CardTitle>
                        <CardDescription>{t('settings.account.broadcastDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBroadcast} className="space-y-4 max-w-lg border rounded-lg p-5 bg-card">
                            <div className="space-y-2">
                                <Label>{t('settings.account.broadcastOptionalTitle')}</Label>
                                <Input
                                    type="text"
                                    placeholder={t('settings.account.broadcastTitlePlaceholder')}
                                    value={broadcastTitle}
                                    onChange={e => setBroadcastTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('settings.account.broadcastMessage')} *</Label>
                                <Textarea
                                    placeholder={t('settings.account.broadcastMessagePlaceholder')}
                                    value={broadcastMsg}
                                    onChange={e => setBroadcastMsg(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSending}>
                                {isSending ? t('settings.account.broadcastSending') : t('settings.account.broadcastSend')}
                            </Button>
                        </form>
                    </CardContent>
                </>
            )}

            <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title={t('settings.account.logoutModalTitle')}>
                <div className="py-2 pb-6">
                    <p className="text-muted-foreground">
                        {t('settings.account.logoutModalQ')}
                    </p>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => setIsLogoutModalOpen(false)} className="w-full sm:w-auto">
                        {t('settings.account.stayBtn')}
                    </Button>
                    <Button variant="destructive" onClick={confirmLogout} className="w-full sm:w-auto">
                        {t('settings.account.logoutConfirmBtn')}
                    </Button>
                </div>
            </Modal>

            {/* Delete Account Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeletePassword(''); setDeleteConfirmText(''); }} title={t('settings.account.deleteModalTitle')}>
                <div className="py-2 pb-4 space-y-4">
                    <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3">
                        <p className="text-sm text-destructive font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {t('settings.account.deleteModalQ')}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>{t('settings.account.deletePasswordLabel')}</Label>
                        <Input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('settings.account.deleteTypeConfirm')}</Label>
                        <Input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder={t('settings.account.deleteTypeHint')} />
                    </div>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => { setIsDeleteModalOpen(false); setDeletePassword(''); setDeleteConfirmText(''); }} className="w-full sm:w-auto">
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={isDeleting || !deletePassword || deleteConfirmText !== t('settings.account.deleteConfirmWord')}
                        className="w-full sm:w-auto"
                        onClick={async () => {
                            setIsDeleting(true);
                            try {
                                await api.delete('/users/me', { data: { password: deletePassword } });
                                localStorage.clear();
                                window.location.href = '/login';
                            } catch (error) {
                                toast.error(resolveError(extractErrorCode(error), t, 'settings.account.deleteFailed'));
                                setIsDeleting(false);
                            }
                        }}
                    >
                        {isDeleting ? t('settings.account.deleteDeleting') : t('settings.account.deleteConfirmBtn')}
                    </Button>
                </div>
            </Modal>
        </Card>
    )
}

function SupportSettings() {
    const { t } = useTranslation();

    const techStack = [
        { name: "React 19", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
        { name: "Vite", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
        { name: "Tailwind CSS", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
        { name: "Redux Toolkit", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
        { name: "Node.js", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
        { name: "Express", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
        { name: "PostgreSQL", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
        { name: "Redis", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
        { name: "Sequelize ORM", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
        { name: "Socket.IO", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
        { name: "Docker", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
        { name: "Nginx", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    ];

    return (
        <div className="space-y-6">
            {/* App Info Card */}
            <Card className="shadow-none border-muted/60">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        {t('settings.support.appInfoTitle')}
                    </CardTitle>
                    <CardDescription>{t('settings.support.desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-lg border p-4 space-y-1">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('settings.support.appVersionLabel')}</p>
                            <p className="text-lg font-bold">{t('settings.support.appName')} <span className="text-primary">v{t('settings.support.appVersion')}</span></p>
                        </div>
                        <div className="rounded-lg border p-4 space-y-1">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('settings.support.appAuthorLabel')}</p>
                            <p className="text-lg font-bold">{t('settings.support.appAuthor')}</p>
                        </div>
                    </div>
                    <div className="space-y-3 pt-2">
                        <Label className="text-base font-semibold">{t('settings.support.techStackTitle')}</Label>
                        <div className="flex flex-wrap gap-2">
                            {techStack.map((tech) => (
                                <span key={tech.name} className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tech.color} transition-transform hover:scale-105`}>
                                    {tech.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Legal & Policies Card */}
            <Card className="shadow-none border-muted/60">
                <CardHeader>
                    <CardTitle>{t('settings.support.legalTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4 space-y-1">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            <Label className="text-base font-semibold">{t('settings.support.termsTitle')}</Label>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{t('settings.support.termsDesc')}</p>
                    </div>
                    <div className="rounded-lg border p-4 space-y-1">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            <Label className="text-base font-semibold">{t('settings.support.privacyTitle')}</Label>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{t('settings.support.privacyDesc')}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Feedback & Source Code Card */}
            <Card className="shadow-none border-muted/60">
                <CardHeader>
                    <CardTitle>{t('settings.support.feedbackTitle')}</CardTitle>
                    <CardDescription>{t('settings.support.feedbackDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">{t('settings.support.feedbackTitle')}</Label>
                            <p className="text-sm text-muted-foreground">{t('settings.support.feedbackDesc')}</p>
                        </div>
                        <Button variant="outline" className="w-full sm:w-auto" asChild>
                            <a href="mailto:support@junkio.com">
                                <Mail className="mr-2 h-4 w-4" /> {t('settings.support.feedbackBtn')}
                            </a>
                        </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">{t('settings.support.sourceCodeTitle')}</Label>
                            <p className="text-sm text-muted-foreground">{t('settings.support.sourceCodeDesc')}</p>
                        </div>
                        <Button variant="outline" className="w-full sm:w-auto" asChild>
                            <a href="https://github.com/ngainhau1/qltc-junkio" target="_blank" rel="noopener noreferrer">
                                <Github className="mr-2 h-4 w-4" /> {t('settings.support.sourceCodeBtn')}
                                <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
