import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { depositToGoal } from '@/features/goals/goalsSlice';
import { addTransaction } from '@/features/transactions/transactionSlice';
import { updateWalletBalance } from '@/features/wallets/walletSlice';
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
    const dispatch = useDispatch();
    const { wallets } = useSelector((state) => state.wallets);
    const [amount, setAmount] = useState('');
    const [selectedWalletId, setSelectedWalletId] = useState(null);

    // Filter to only show personal wallets with balance > 0
    const availableWallets = wallets.filter(w => !w.familyId && w.balance > 0);

    const handleDeposit = () => {
        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) {
            toast.error("Vui lòng nhập số tiền hợp lệ");
            return;
        }

        if (!selectedWalletId) {
            toast.error("Vui lòng chọn ví trích tiền");
            return;
        }

        const wallet = wallets.find(w => w.id === selectedWalletId);
        if (numAmount > wallet.balance) {
            toast.error(`Số dư trong ví không đủ. Ví đang có ${formatCurrency(wallet.balance)}`);
            return;
        }

        const remainingNeeded = goal.targetAmount - goal.currentAmount;
        if (numAmount > remainingNeeded) {
            toast.error(`Số tiền nạp vượt quá mục tiêu cần thiết (${formatCurrency(remainingNeeded)} nữa)`);
            return;
        }

        // 1. Deduct from wallet & create transaction
        dispatch(addTransaction({
            walletId: selectedWalletId,
            categoryId: 'cat-savings', // System category for savings
            amount: numAmount,
            type: 'EXPENSE',
            date: new Date().toISOString(),
            description: `Nạp tiền mục tiêu: ${goal.name}`
        }));

        dispatch(updateWalletBalance({
            id: selectedWalletId,
            amount: numAmount,
            type: 'EXPENSE'
        }));

        // 2. Deposit to Goal
        dispatch(depositToGoal({ id: goal.id, amount: numAmount }));

        toast.success(`Đã nạp thành công ${formatCurrency(numAmount)} vào ${goal.name}`);
        onClose();
        setAmount('');
        setSelectedWalletId(null);
    };

    if (!goal) return null;

    const IconComp = ICONS[goal.imageUrl] || Target;
    const remainingNeeded = goal.targetAmount - goal.currentAmount;
    const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nạp Tiền Mục Tiêu">
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
                            <span className="text-xs font-semibold text-primary">Cần thêm: {formatCurrency(remainingNeeded)}</span>
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
                        <Label htmlFor="deposit-amount" className="text-muted-foreground">Nhập số tiền muốn nạp</Label>
                        <div className="relative max-w-[250px] mx-auto">
                            <Input
                                id="deposit-amount"
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
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
                                onClick={() => setAmount(qAmount.toString())}
                                className="px-3 py-1.5 rounded-full border border-border bg-card text-xs font-semibold hover:border-primary hover:bg-primary/5 transition-all"
                            >
                                +{qAmount / 1000}k
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <Label className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" /> Nguồn Tiền (Ví Cá Nhân)
                    </Label>
                    {availableWallets.length === 0 ? (
                        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl text-center font-medium border border-destructive/20">
                            Bạn không có ví cá nhân nào có số dư để trích.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto p-1 scrollbar-thin">
                            {availableWallets.map(wallet => (
                                <div
                                    key={wallet.id}
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
                    <Button variant="ghost" onClick={onClose} className="rounded-xl">Hủy</Button>
                    <Button
                        onClick={handleDeposit}
                        disabled={!selectedWalletId || !amount || availableWallets.length === 0}
                        className="rounded-xl px-8 shadow-md hover:shadow-lg transition-all"
                        style={{ backgroundColor: goal.colorCode }}
                    >
                        Xác Nhận Nạp
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
