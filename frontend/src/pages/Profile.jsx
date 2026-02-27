import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateProfile } from "@/features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Phone, Calendar, Link as LinkIcon, Save } from "lucide-react";

export function Profile() {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);

    // Provide initial state directly from redux where possible to avoid effect updates
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

    const handleSave = (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name.trim()) {
            toast.error("Vui lòng nhập họ tên.");
            return;
        }

        // Dispatch to Redux
        dispatch(updateProfile({
            name: formData.name,
            phone: formData.phone,
            dateOfBirth: formData.dateOfBirth,
            avatarUrl: formData.avatarUrl,
        }));

        toast.success("Đã cập nhật thông tin thành công!");
    };

    const handleGenerateAvatar = () => {
        const randomSeed = Math.random().toString(36).substring(7);
        setFormData(prev => ({
            ...prev,
            avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${randomSeed}`
        }));
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
                <p className="text-muted-foreground">
                    Quản lý thông tin cá nhân và tài khoản của bạn.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cột trái: Avatar */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle>Ảnh Đại Diện</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center space-y-4">
                            <div className="relative group">
                                <img
                                    src={formData.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'demo'}`}
                                    alt="Profile"
                                    className="w-40 h-40 rounded-full border-4 border-muted object-cover bg-primary/10"
                                />
                            </div>

                            <div className="w-full space-y-3 pt-4">
                                <form onSubmit={e => e.preventDefault()} className="space-y-2">
                                    <Label htmlFor="avatarUrl" className="text-xs text-muted-foreground flex items-center gap-1">
                                        <LinkIcon className="h-3 w-3" /> Liên kết ảnh hiện tại
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
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={handleGenerateAvatar}
                                >
                                    Tạo ảnh ngẫu nhiên
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Cột phải: Thông tin form */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSave}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin cơ bản</CardTitle>
                                <CardDescription>
                                    Thông tin này sẽ được hiển thị trên hệ thống và với các thành viên trong gia đình.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="flex items-center gap-2">
                                        <User className="h-4 w-4" /> Họ và tên <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Nhập họ và tên..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" /> Địa chỉ Email
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
                                        Email là thông tin đăng nhập và không thể thay đổi.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" /> Số điện thoại
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
                                            <Calendar className="h-4 w-4" /> Ngày sinh
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

                                <div className="pt-6 flex justify-end gap-4">
                                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                        Hủy bỏ
                                    </Button>
                                    <Button type="submit" className="gap-2">
                                        <Save className="h-4 w-4" />
                                        Lưu thay đổi
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
