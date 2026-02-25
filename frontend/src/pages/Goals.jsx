import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Target, Plus, Laptop, Plane, ShieldCheck, CheckCircle2, TrendingUp, Gamepad2, Home as HomeIcon, Car, Smartphone, GraduationCap, Coins } from 'lucide-react';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DepositModal } from '@/components/features/goals/DepositModal';
import { CreateGoalModal } from '@/components/features/goals/CreateGoalModal';

// Icon Map for dynamic rendering
const iconMap = {
    Laptop: Laptop,
    Plane: Plane,
    ShieldCheck: ShieldCheck,
    Gamepad2: Gamepad2,
    Home: HomeIcon,
    Car: Car,
    Smartphone: Smartphone,
    GraduationCap: GraduationCap,
    Coins: Coins,
};

export function Goals() {
    const { items: goals } = useSelector(state => state.goals);

    // Derived states
    const activeGoals = goals.filter(g => g.status === 'IN_PROGRESS');
    const achievedGoals = goals.filter(g => g.status === 'ACHIEVED');
    const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);

    // Modal states
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleOpenDeposit = (goal) => {
        setSelectedGoal(goal);
        setIsDepositModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 rounded-3xl border border-primary/20">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                        <Target className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Mục Tiêu Tài Chính</h1>
                        <p className="text-muted-foreground mt-1">Biến ước mơ thành hiện thực thông qua tiết kiệm.</p>
                    </div>
                </div>
                <Button
                    className="w-full sm:w-auto gap-2 shadow-lg hover:shadow-xl transition-all h-11"
                    size="lg"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="h-5 w-5" /> Tạo Mục Tiêu Mới
                </Button>
            </header>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Tổng đang tích lũy</p>
                            <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(totalSaved)}</p>
                        </div>
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Mục tiêu đã đạt</p>
                            <p className="text-3xl font-bold text-emerald-500 mt-1">{achievedGoals.length}</p>
                        </div>
                        <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Goals Grid */}
            <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">Hũ Đang Mở <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">{activeGoals.length}</span></h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {activeGoals.map(goal => {
                        const IconComponent = iconMap[goal.imageUrl] || Target;
                        const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

                        return (
                            <Card key={goal.id} className="overflow-hidden hover:shadow-md transition-shadow group border-border/60">
                                <CardContent className="p-0">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-sm"
                                                    style={{ backgroundColor: goal.colorCode }}
                                                >
                                                    <IconComponent className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{goal.name}</h3>
                                                    <p className="text-sm text-muted-foreground">Hạn chót: <span className="font-medium text-foreground">{formatShortDate(goal.deadline)}</span></p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Cần góp thêm</p>
                                                <p className="text-lg font-bold text-destructive">
                                                    {formatCurrency(goal.targetAmount - goal.currentAmount)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Progress Bar Area */}
                                        <div className="space-y-2 mb-6">
                                            <div className="flex justify-between text-sm font-medium">
                                                <span className="text-primary">{formatCurrency(goal.currentAmount)}</span>
                                                <span className="text-muted-foreground">{formatCurrency(goal.targetAmount)}</span>
                                            </div>
                                            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden relative">
                                                <div
                                                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${percentage}%`, backgroundColor: goal.colorCode }}
                                                />
                                            </div>
                                            <p className="text-right text-xs font-bold text-muted-foreground">{percentage}%</p>
                                        </div>

                                        <Button
                                            className="w-full text-foreground hover:text-primary-foreground transition-colors font-semibold shadow-sm"
                                            style={{ backgroundColor: `${goal.colorCode}20`, color: goal.colorCode }}
                                            onClick={() => handleOpenDeposit(goal)}
                                        >
                                            Nạp Tiền Vào Hũ
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Achieved Goals List */}
            {achievedGoals.length > 0 && (
                <div className="pt-8 opacity-80">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-500">
                        <CheckCircle2 className="h-5 w-5" /> Đã Hoàn Thành
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {achievedGoals.map(goal => {
                            const IconComponent = iconMap[goal.imageUrl] || Target;
                            return (
                                <Card key={goal.id} className="bg-emerald-500/5 border-emerald-500/20">
                                    <div className="p-4 flex items-center gap-3">
                                        <div className="h-10 w-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center">
                                            <IconComponent className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{goal.name}</h3>
                                            <p className="text-xs text-emerald-600 font-medium">Đạt {formatCurrency(goal.targetAmount)}</p>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedGoal && (
                <DepositModal
                    isOpen={isDepositModalOpen}
                    onClose={() => {
                        setIsDepositModalOpen(false);
                        setSelectedGoal(null);
                    }}
                    goal={selectedGoal}
                />
            )}

            <CreateGoalModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
