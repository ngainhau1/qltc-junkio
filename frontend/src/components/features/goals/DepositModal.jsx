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
import { Target, Laptop, Plane, ShieldCheck, Gamepad2, Home as HomeIcon, Car, Smartphone, GraduationCap, Coins, Wallet } from 'lucide-react';

const ICONS = {
    Laptop, Plane, ShieldCheck, Gamepad2, Home: HomeIcon, Car, Smartphone, GraduationCap, Coins
};

const QUICK_AMOUNTS = [100000, 500000, 1000000, 5000000];

export function DepositModal({ isOpen, onClose, goal }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { wallets } = useSelector((state) => state.wallets);
    const [amount, setAmount] = useState('');
    const [selectedWalletId, setSelectedWalletId] = useState(null);

    // Filter to only show personal wallets with balance > 0
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

        const wallet = wallets.find(w => w.id === selectedWalletId);
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
            // API call handles deducting wallet balance, updating goal, and creating transaction report
            await dispatch(depositAmount({ 
                id: goal.id, 
                amount: numAmount, 
                wallet_id: selectedWalletId 
            })).unwrap();

            toast.success(t('goals.modals.deposit.successMsg', { amount: formatCurrency(numAmount), name: goal.name }));
            onClose();
            setAmount('');
            setSelectedWalletId(null);
        } catch (error) {
            console.error("Goal deposit failed:", error);
            toast.error(error);
        }
    };

    if (!goal) return null;

    const IconComp = ICONS[goal.imageUrl] || Target;
    const remainingNeeded = goal.targetAmount - goal.currentAmount;
    const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

    const handleSetAmount = (newAmountStr) => {
        const numAmount = Number(newAmountStr) || 0;
        const cappedAmount = Math.min(numAmount, remainingNeeded);

        // If the user cleared the input, allow it to be empty
        // otherwise, convert the capped number to string
        if (newAmountStr === '') {
            setAmount('');
        } else {
            setAmount(cappedAmount.toString());
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('goals.modals.deposit.title')}
            contentTestId="goal-deposit-modal"
        >
            <div className="p-6 space-y-6">
                {/* Visual Header */}
                <div className="flex bg-muted/30 p-4 rounded-2xl items-center gap-4 border border-border/50">
                    <div
                        className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                        style={{ backgroundColor: goal.colorCode }}
                    >
                        <IconComp className="h-7 w-7" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <h3 className="font-bold text-lg truncate">{goal.name}</h3>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-sm font-medium text-muted-foreground">{percentage}%</span>
                            <span className="text-xs font-semibold text-primary">{t('goals.modals.deposit.needMore')} {formatCurrency(remainingNeeded)}</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full mt-1.5 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${percentage}%`, backgroundColor: goal.colorCode }}
                            />
                        </div>
                    </div>
                </div>

                {/* Amount Input area */}
                <div className="space-y-4">
                    <div className="text-center space-y-2">
                        <Label htmlFor="deposit-amount" className="text-muted-foreground">{t('goals.modals.deposit.inputLabel')}</Label>
                        <div className="relative max-w-[250px] mx-auto">
                            <Input
                                id="deposit-amount"
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => handleSetAmount(e.target.value)}
                                className="text-center text-3xl font-bold h-16 rounded-2xl border-2 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₫</span>
                        </div>
                    </div>

                    {/* Quick Amounts */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {QUICK_AMOUNTS.map((qAmount) => (
                            <button
                                key={qAmount}
                                type="button"
                                onClick={() => {
                                    const currentVal = Number(amount) || 0;
                                    handleSetAmount((currentVal + qAmount).toString());
                                }}
                                className="px-3 py-1.5 rounded-full border border-border bg-card text-xs font-semibold hover:border-primary hover:bg-primary/5 transition-all active:scale-95"
                            >
                                +{qAmount / 1000}k
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setAmount(remainingNeeded.toString())}
                            className="px-3 py-1.5 rounded-full border border-primary bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
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
                        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl text-center font-medium border border-destructive/20">
                            {t('goals.modals.deposit.emptyWallet')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto p-1 scrollbar-thin">
                            {availableWallets.map(wallet => (
                                <div
                                    key={wallet.id}
                                    data-testid="goal-deposit-wallet-option"
                                    onClick={() => setSelectedWalletId(wallet.id)}
                                    className={`cursor-pointer rounded-xl border-2 transition-all p-3 flex flex-col justify-center ${selectedWalletId === wallet.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:border-primary/50 bg-card hover:shadow-sm'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-sm truncate pr-2">{wallet.name}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium shrink-0">{wallet.currency}</span>
                                    </div>
                                    <div className="font-bold text-foreground">{formatCurrency(wallet.balance)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-4 flex gap-3 justify-end border-t border-border">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl">{t('goals.modals.deposit.btnCancel')}</Button>
                    <Button
                        data-testid="goal-deposit-submit"
                        onClick={handleDeposit}
                        disabled={!selectedWalletId || !amount || availableWallets.length === 0}
                        className="rounded-xl px-8 shadow-md hover:shadow-lg transition-all"
                        style={{ backgroundColor: goal.colorCode }}
                    >
                        {t('goals.modals.deposit.btnConfirm')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
