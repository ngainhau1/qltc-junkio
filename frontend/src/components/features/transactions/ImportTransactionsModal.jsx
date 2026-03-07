import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Upload, FileType, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { importFromCSV } from '@/services/importService';
import { fetchTransactions } from '@/features/transactions/transactionSlice';
import { fetchWallets } from '@/features/wallets/walletSlice';

export function ImportTransactionsModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [defaultWalletId, setDefaultWalletId] = useState('');
    const [status, setStatus] = useState('IDLE'); // IDLE, UPLOADING, SUCCESS, ERROR
    const [message, setMessage] = useState('');

    const { wallets } = useSelector(state => state.wallets);
    const { activeFamilyId } = useSelector(state => state.families);

    // Lọc ví theo family/personal context
    const contextWallets = wallets.filter(w =>
        activeFamilyId ? w.family_id === activeFamilyId : !w.family_id
    );

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'text/csv' || selectedFile?.name.endsWith('.csv')) {
            setFile(selectedFile);
            setStatus('IDLE');
            setMessage('');
        } else {
            setFile(null);
            setStatus('ERROR');
            setMessage(t('transactions.import.invalidFile', 'Vui lòng chọn file định dạng CSV hợp lệ.'));
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        let targetWalletId = defaultWalletId;
        if (!targetWalletId && contextWallets.length > 0) {
            targetWalletId = contextWallets[0].id;
        }

        setStatus('UPLOADING');
        try {
            const result = await importFromCSV(file, targetWalletId);
            setStatus('SUCCESS');
            setMessage(result.message || t('transactions.import.success', `Nhập thành công ${result.count} giao dịch.`));

            // Format refresh dữ liệu sau khi import thành công
            dispatch(fetchTransactions());
            dispatch(fetchWallets());

            // Tự đóng modal sau 2 giây
            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (error) {
            setStatus('ERROR');
            setMessage(error.message);
        }
    };

    const handleClose = () => {
        setFile(null);
        setDefaultWalletId('');
        setStatus('IDLE');
        setMessage('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={t('transactions.import.title', 'Nhập Giao Dịch Hàng Loạt (Export từ App/Web khác)')}
        >
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t('transactions.import.selectWallet', 'Ví nhận tiền mặc định (nếu CSV không chỉ định):')}
                    </label>
                    <select
                        className="w-full border rounded-md h-10 px-3 bg-background"
                        value={defaultWalletId}
                        onChange={(e) => setDefaultWalletId(e.target.value)}
                    >
                        {contextWallets.length === 0 && (
                            <option value="" disabled>Không có ví nào khả dụng</option>
                        )}
                        {contextWallets.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>

                <div
                    className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />

                    {file ? (
                        <div className="flex flex-col items-center">
                            <FileType className="h-10 w-10 text-blue-500 mb-2" />
                            <p className="font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                            <p className="font-medium">Nhấn vào đây để chọn file CSV</p>
                            <p className="text-sm text-muted-foreground mt-1">Hỗ trợ định dạng: .csv (Ví dụ: báo cáo từ sổ thu chi cũ)</p>
                        </div>
                    )}
                </div>

                {status === 'ERROR' && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-start gap-2 text-sm border border-red-200">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>{message}</p>
                    </div>
                )}

                {status === 'SUCCESS' && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-md flex items-center gap-2 text-sm border border-green-200">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <p>{message}</p>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose} disabled={status === 'UPLOADING'}>
                        {t('common.cancel', 'Hủy')}
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!file || status === 'UPLOADING' || contextWallets.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                    >
                        {status === 'UPLOADING' ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang nhập...</>
                        ) : (
                            t('transactions.import.submit', 'Nhập Dữ Liệu')
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
