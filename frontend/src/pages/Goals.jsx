import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Target, Plus, Laptop, Plane, ShieldCheck, CheckCircle2, TrendingUp, Gamepad2, Home as HomeIcon, Car, Smartphone, GraduationCap, Coins } from 'lucide-react';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DepositModal } from '@/components/features/goals/DepositModal';
import { CreateGoalModal } from '@/components/features/goals/CreateGoalModal';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/PageHeader';

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
    const { t } = useTranslation();
    const { goals = [] } = useSelector(state => state.goals);

    // Derived states
    const activeGoals = goals.filter(g => g.status === 'IN_PROGRESS');
    const achievedGoals = goals.filter(g => g.status === 'ACHIEVED');
    const totalSaved = activeGoals.reduce((sum, g) => sum + parseFloat(g.currentAmount || 0), 0);

    // Modal states
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleOpenDeposit = (goal) => {
        setSelectedGoal(goal);
        setIsDepositModalOpen(true);
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500 sm:space-y-6">
            {/* Header Area */}
            <PageHeader
                title={t('goals.title')}
                description={t('goals.desc')}
                actions={
                    <Button
                        className="w-full gap-2 shadow-lg hover:shadow-xl transition-all h-11 md:w-auto"
                        size="lg"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <Plus className="h-5 w-5" /> {t('goals.btnCreate')}
                    </Button>
                }
            />

            {/* Overview Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardContent className="p-3 flex items-center justify-between sm:p-6">
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground sm:text-sm">{t('goals.overviewTotal')}</p>
                            <p className="text-lg font-bold text-primary mt-1 truncate sm:text-3xl">{formatCurrency(totalSaved)}</p>
                        </div>
                        <div className="h-10 w-10 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary sm:h-12 sm:w-12">
                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardContent className="p-3 flex items-center justify-between sm:p-6">
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground sm:text-sm">{t('goals.overviewAchieved')}</p>
                            <p className="text-lg font-bold text-emerald-500 mt-1 sm:text-3xl">{achievedGoals.length}</p>
                        </div>
                        <div className="h-10 w-10 shrink-0 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 sm:h-12 sm:w-12">
                            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Goals Grid */}
            <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2 sm:text-xl sm:mb-6">{t('goals.activeGoals')} <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">{activeGoals.length}</span></h2>

                {activeGoals.length === 0 ? (
                    <EmptyState
                        icon={Target}
                        title={t('goals.emptyTitle')}
                        description={t('goals.emptyDesc')}
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 sm:gap-6">
                        {activeGoals.map(goal => {
                            const IconComponent = iconMap[goal.imageUrl] || Target;
                            const percentage = Math.min(100, Math.round((parseFloat(goal.currentAmount || 0) / parseFloat(goal.targetAmount || 1)) * 100));

                            return (
                                <Card
                                    key={goal.id}
                                    data-testid="goal-card"
                                    className="overflow-hidden hover:shadow-md transition-shadow group border-border/60"
                                >
                                    <CardContent className="p-0">
                                        <div className="p-4 sm:p-6">
                                            <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                                    <div
                                                        className="h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-sm sm:h-14 sm:w-14"
                                                        style={{ backgroundColor: goal.colorCode }}
                                                    >
                                                        <IconComponent className="h-5 w-5 sm:h-7 sm:w-7" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="truncate font-bold text-base group-hover:text-primary transition-colors sm:text-lg">{goal.name}</h3>
                                                        <p className="text-xs text-muted-foreground sm:text-sm">{t('goals.deadline')} <span className="font-medium text-foreground">{formatShortDate(goal.deadline)}</span></p>
                                                    </div>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{t('goals.remainingNeeded')}</p>
                                                    <p className="text-lg font-bold text-destructive">
                                                        {formatCurrency(parseFloat(goal.targetAmount || 0) - parseFloat(goal.currentAmount || 0))}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Progress Bar Area */}
                                            <div className="space-y-2 mb-4 sm:mb-6">
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
                                                data-testid="goal-deposit-open"
                                                className="w-full text-foreground hover:text-primary-foreground transition-colors font-semibold shadow-sm"
                                                style={{ backgroundColor: `${goal.colorCode}20`, color: goal.colorCode }}
                                                onClick={() => handleOpenDeposit(goal)}
                                            >
                                                {t('goals.btnDeposit')}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Achieved Goals List */}
            {achievedGoals.length > 0 && (
                <div className="pt-4 opacity-80 sm:pt-8">
                    <h2 className="text-base font-bold mb-3 flex items-center gap-2 text-emerald-500 sm:text-lg sm:mb-4">
                        <CheckCircle2 className="h-5 w-5" /> {t('goals.achievedTitle')}
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                        {achievedGoals.map(goal => {
                            const IconComponent = iconMap[goal.imageUrl] || Target;
                            return (
                                <Card key={goal.id} className="bg-emerald-500/5 border-emerald-500/20">
                                    <div className="p-3 flex items-center gap-3 sm:p-4">
                                        <div className="h-10 w-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center">
                                            <IconComponent className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{goal.name}</h3>
                                            <p className="text-xs text-emerald-600 font-medium">{t('goals.achievedSub')} {formatCurrency(goal.targetAmount)}</p>
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
