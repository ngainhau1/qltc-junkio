import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { depositAmount } from '@/features/goals/goalsSlice';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractErrorCode, resolveError } from '@/utils/authErrors';
import { Target, Laptop, Plane, ShieldCheck, Gamepad2, Home as HomeIcon, Car, Smartphone, GraduationCap, Coins, Wallet } from 'lucide-react';

const ICONS = {
    Laptop,
    Plane,
    ShieldCheck,
    Gamepad2,
    Home: HomeIcon,
    Car,
    Smartphone,
    GraduationCap,
    Coins,
};

const QUICK_AMOUNTS = [100000, 500000, 1000000, 5000000];

export function DepositModal({ isOpen, onClose, goal }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { wallets } = useSelector((state) => state.wallets);
    const [amount, setAmount] = useState('');
    const [selectedWalletId, setSelectedWalletId] = useState(null);

    const availableWallets = wallets.filter((wallet) => !wallet.family_id && !wallet.familyId && Number(wallet.balance) > 0);

    const handleDeposit = async () => {
        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) {
            toast.error(t('goals.modals.deposit.errInvalid'));
            return;
        }

        if (!selectedWalletId) {
            toast.error(t('goals.modals.deposit.errSelectWallet'));
            return;
        }

        const wallet = wallets.find((entry) => entry.id === selectedWalletId);
        if (numAmount > wallet.balance) {
            toast.error(t('goals.modals.deposit.errNotEnough', { amount: formatCurrency(wallet.balance) }));
            return;
        }

        const remainingNeeded = goal.targetAmount - goal.currentAmount;
        if (numAmount > remainingNeeded) {
            toast.error(t('goals.modals.deposit.errOverfill', { amount: formatCurrency(remainingNeeded) }));
            return;
        }

        try {
            await dispatch(
                depositAmount({
                    id: goal.id,
                    amount: numAmount,
                    wallet_id: selectedWalletId,
                })
            ).unwrap();

            toast.success(t('goals.modals.deposit.successMsg', { amount: formatCurrency(numAmount), name: goal.name }));
            onClose();
            setAmount('');
            setSelectedWalletId(null);
        } catch (error) {
            console.error('Goal deposit failed:', error);
            toast.error(resolveError(extractErrorCode(error), t, 'errors.goals.depositFailed'));
        }
    };

    if (!goal) return null;

    const IconComp = ICONS[goal.imageUrl] || Target;
    const remainingNeeded = goal.targetAmount - goal.currentAmount;
    const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

    const handleSetAmount = (newAmountStr) => {
        const numAmount = Number(newAmountStr) || 0;
        const cappedAmount = Math.min(numAmount, remainingNeeded);

        if (newAmountStr === '') {
            setAmount('');
        } else {
            setAmount(cappedAmount.toString());
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('goals.modals.deposit.title')} contentTestId="goal-deposit-modal">
            <div className="space-y-6 p-2 sm:p-4">
                <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-muted/30 p-4">
                    <div
                        className="h-14 w-14 shrink-0 rounded-2xl text-white shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: goal.colorCode }}
                    >
                        <IconComp className="h-7 w-7" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <h3 className="truncate text-lg font-bold">{goal.name}</h3>
                        <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{percentage}%</span>
                            <span className="text-xs font-semibold text-primary">
                                {t('goals.modals.deposit.needMore')} {formatCurrency(remainingNeeded)}
                            </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%`, backgroundColor: goal.colorCode }} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2 text-center">
                        <Label htmlFor="deposit-amount" className="text-muted-foreground">
                            {t('goals.modals.deposit.inputLabel')}
                        </Label>
                        <div className="relative mx-auto w-full max-w-[250px]">
                            <Input
                                id="deposit-amount"
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(event) => handleSetAmount(event.target.value)}
                                className="h-16 rounded-2xl border-2 text-center text-3xl font-bold transition-colors focus-visible:border-primary focus-visible:ring-0"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">VND</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                        {QUICK_AMOUNTS.map((quickAmount) => (
                            <button
                                key={quickAmount}
                                type="button"
                                onClick={() => {
                                    const currentVal = Number(amount) || 0;
                                    handleSetAmount((currentVal + quickAmount).toString());
                                }}
                                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-all hover:border-primary hover:bg-primary/5 active:scale-95"
                            >
                                +{quickAmount / 1000}k
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setAmount(remainingNeeded.toString())}
                            className="rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                        >
                            {t('goals.modals.deposit.quickFill')}
                        </button>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <Label className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" /> {t('goals.modals.deposit.sourceWallet')}
                    </Label>
                    {availableWallets.length === 0 ? (
                        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center text-sm font-medium text-destructive">
                            {t('goals.modals.deposit.emptyWallet')}
                        </div>
                    ) : (
                        <div className="grid max-h-[220px] grid-cols-1 gap-3 overflow-y-auto p-1 sm:grid-cols-2">
                            {availableWallets.map((wallet) => (
                                <div
                                    key={wallet.id}
                                    data-testid="goal-deposit-wallet-option"
                                    onClick={() => setSelectedWalletId(wallet.id)}
                                    className={`flex cursor-pointer flex-col justify-center rounded-xl border-2 p-3 transition-all ${selectedWalletId === wallet.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 bg-card hover:border-primary/50 hover:shadow-sm'}`}
                                >
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="truncate pr-2 text-sm font-semibold">{wallet.name}</span>
                                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                                            {wallet.currency}
                                        </span>
                                    </div>
                                    <div className="font-bold text-foreground">{formatCurrency(wallet.balance)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-4 sm:flex-row">
                    <Button variant="ghost" onClick={onClose} className="w-full rounded-xl sm:w-auto">
                        {t('goals.modals.deposit.btnCancel')}
                    </Button>
                    <Button
                        data-testid="goal-deposit-submit"
                        onClick={handleDeposit}
                        disabled={!selectedWalletId || !amount || availableWallets.length === 0}
                        className="w-full rounded-xl px-8 shadow-md transition-all hover:shadow-lg sm:w-auto"
                        style={{ backgroundColor: goal.colorCode }}
                    >
                        {t('goals.modals.deposit.btnConfirm')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
