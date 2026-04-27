import { useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateProfileAsync, uploadUserAvatar } from "@/features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Phone, Calendar, Link as LinkIcon, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { extractErrorCode, resolveError } from "@/utils/authErrors";

export function Profile() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || '/api';
    const serverUrl = API_URL.replace('/api', '');

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        dateOfBirth: user?.dateOfBirth || "",
        avatarUrl: user?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'demo'}`,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error(t('profile.reqName'));
            return;
        }

        try {
            await dispatch(updateProfileAsync({
                name: formData.name,
                phone: formData.phone,
                dateOfBirth: formData.dateOfBirth,
                avatarUrl: formData.avatarUrl,
            })).unwrap();

            toast.success(t('profile.successMsg'));
        } catch (error) {
            toast.error(resolveError(extractErrorCode(error), t, 'profile.saveFailed'));
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error(t('profile.onlyImageAllowed'));
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        setIsUploading(true);
        try {
            const result = await dispatch(uploadUserAvatar(formData)).unwrap();
            setFormData(prev => ({
                ...prev,
                avatarUrl: result.avatarUrl
            }));
            toast.success(t('profile.uploadSuccess'));
        } catch (error) {
            toast.error(resolveError(extractErrorCode(error), t, 'profile.uploadFailed'));
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('profile.title')}</h1>
                <p className="text-muted-foreground">
                    {t('profile.desc')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle>{t('profile.avatarTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center space-y-4">
                            <div className="relative group">
                                <img
                                    src={formData.avatarUrl?.startsWith('/uploads') ? `${serverUrl}${formData.avatarUrl}` : (formData.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'demo'}`)}
                                    alt="Profile"
                                    className="w-40 h-40 rounded-full border-4 border-muted object-cover bg-primary/10"
                                />
                            </div>

                            <div className="w-full space-y-3 pt-4">
                                <form onSubmit={e => e.preventDefault()} className="space-y-2">
                                    <Label htmlFor="avatarUrl" className="text-xs text-muted-foreground flex items-center gap-1">
                                        <LinkIcon className="h-3 w-3" /> {t('profile.avatarCurrent')}
                                    </Label>
                                    <Input
                                        id="avatarUrl"
                                        name="avatarUrl"
                                        value={formData.avatarUrl}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        className="text-xs h-8"
                                    />
                                </form>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? t('common.loading') : t('profile.avatarUpload')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <form onSubmit={handleSave}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('profile.basicInfo')}</CardTitle>
                                <CardDescription>
                                    {t('profile.basicDesc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="flex items-center gap-2">
                                        <User className="h-4 w-4" /> {t('profile.fullName')} <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder={t('profile.fullNamePlaceholder')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" /> {t('profile.email')}
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="bg-muted text-muted-foreground"
                                    />
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        {t('profile.emailNote')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" /> {t('profile.phone')}
                                        </Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="09..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" /> {t('profile.dob')}
                                        </Label>
                                        <Input
                                            id="dateOfBirth"
                                            name="dateOfBirth"
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end sm:gap-4">
                                    <Button type="button" variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
                                        {t('profile.cancel')}
                                    </Button>
                                    <Button type="submit" className="w-full gap-2 sm:w-auto">
                                        <Save className="h-4 w-4" />
                                        {t('profile.save')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </div>
    );
}
