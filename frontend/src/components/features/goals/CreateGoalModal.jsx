import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { createGoal } from '@/features/goals/goalsSlice';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { extractErrorCode, resolveError } from '@/utils/authErrors';
import { Laptop, Plane, ShieldCheck, Gamepad2, Home as HomeIcon, Car, Smartphone, GraduationCap, Coins, Target } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const ICONS = [
    { name: 'Laptop', icon: Laptop },
    { name: 'Plane', icon: Plane },
    { name: 'ShieldCheck', icon: ShieldCheck },
    { name: 'Gamepad2', icon: Gamepad2 },
    { name: 'Home', icon: HomeIcon },
    { name: 'Car', icon: Car },
    { name: 'Smartphone', icon: Smartphone },
    { name: 'GraduationCap', icon: GraduationCap },
    { name: 'Coins', icon: Coins },
];

export function CreateGoalModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [colorCode, setColorCode] = useState(COLORS[0]);
    const [imageUrl, setImageUrl] = useState(ICONS[0].name);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error(t('goals.modals.create.errName'));
            return;
        }

        const numTarget = Number(targetAmount);
        if (!numTarget || numTarget <= 0) {
            toast.error(t('goals.modals.create.errAmount'));
            return;
        }

        if (!deadline) {
            toast.error(t('goals.modals.create.errDate'));
            return;
        }

        const selectedDate = new Date(deadline);
        if (selectedDate <= new Date()) {
            toast.error(t('goals.modals.create.errFuture'));
            return;
        }

        try {
            await dispatch(createGoal({
                name: name.trim(),
                targetAmount: numTarget,
                deadline: selectedDate.toISOString(),
                colorCode,
                imageUrl
            })).unwrap();

            toast.success(t('goals.modals.create.successMsg', { name: name.trim() }));

            setName('');
            setTargetAmount('');
            setDeadline('');
            setColorCode(COLORS[0]);
            setImageUrl(ICONS[0].name);
            onClose();
        } catch (error) {
            console.error("Goal creation failed:", error);
            toast.error(resolveError(extractErrorCode(error), t, 'errors.goals.createFailed'));
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('goals.modals.create.title')}
            contentTestId="create-goal-modal"
        >
            <div className="space-y-6 p-2 sm:p-4">

                <div className="flex items-center justify-center p-6 rounded-xl border border-dashed border-border/60 bg-muted/20">
                    <div className="flex flex-col items-center gap-3">
                        <div
                            className="h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-md transition-all duration-300"
                            style={{ backgroundColor: colorCode }}
                        >
                            {(() => {
                                const IconComp = ICONS.find(i => i.name === imageUrl)?.icon || Target;
                                return <IconComp className="h-8 w-8" />;
                            })()}
                        </div>
                        <div className="text-center">
                            <h4 className="font-bold text-lg">{name || t('goals.modals.create.previewDefault')}</h4>
                            <p className="text-sm font-medium text-primary">
                                {t('goals.modals.create.targetPreview')} {targetAmount ? formatCurrency(Number(targetAmount)) : formatCurrency(0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-full space-y-2">
                        <Label htmlFor="goal-name">{t('goals.modals.create.nameLabel')}</Label>
                        <Input
                            id="goal-name"
                            placeholder={t('goals.modals.create.namePlaceholder')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="goal-amount">{t('goals.modals.create.amountLabel')}</Label>
                        <Input
                            id="goal-amount"
                            type="number"
                            placeholder="50000000"
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="goal-deadline">{t('goals.modals.create.dateLabel')}</Label>
                        <Input
                            id="goal-deadline"
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                        />
                    </div>

                    <div className="col-span-full space-y-2 pt-2">
                        <Label>{t('goals.modals.create.colorLabel')}</Label>
                        <div className="flex flex-wrap gap-3">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`h-8 w-8 rounded-full shadow-sm border-2 transition-all ${colorCode === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setColorCode(color)}
                                    title={`Color ${color}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="col-span-full space-y-2 pt-2">
                        <Label>{t('goals.modals.create.iconLabel')}</Label>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3">
                            {/* eslint-disable-next-line no-unused-vars */}
                            {ICONS.map(({ name: iconName, icon: Icon }) => (
                                <button
                                    key={iconName}
                                    type="button"
                                    className={`p-2 flex items-center justify-center rounded-xl border-2 transition-all ${imageUrl === iconName ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:bg-muted/50'}`}
                                    onClick={() => setImageUrl(iconName)}
                                >
                                    <Icon className="h-6 w-6" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-4 sm:flex-row">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">{t('goals.modals.create.btnCancel')}</Button>
                    <Button data-testid="create-goal-submit" onClick={handleCreate} className="w-full sm:w-auto">
                        {t('goals.modals.create.btnSubmit')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
