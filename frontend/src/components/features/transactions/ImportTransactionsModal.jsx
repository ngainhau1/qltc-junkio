import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, FileType, Loader2, Upload } from 'lucide-react';
import { importFromCSV } from '@/services/importService';
import { refreshFinanceData } from '@/features/finance/refreshFinanceData';

export function ImportTransactionsModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [defaultWalletId, setDefaultWalletId] = useState('');
    const [status, setStatus] = useState('IDLE');
    const [message, setMessage] = useState('');

    const { wallets } = useSelector((state) => state.wallets);
    const { activeFamilyId } = useSelector((state) => state.families);

    const contextWallets = wallets.filter((wallet) => (activeFamilyId ? wallet.family_id === activeFamilyId : !wallet.family_id));

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];

        if ((selectedFile && selectedFile.type === 'text/csv') || selectedFile?.name.endsWith('.csv')) {
            setFile(selectedFile);
            setStatus('IDLE');
            setMessage('');
            return;
        }

        setFile(null);
        setStatus('ERROR');
        setMessage(t('transactions.import.invalidFile'));
    };

    const handleUpload = async () => {
        if (!file) {
            return;
        }

        const targetWalletId = defaultWalletId || contextWallets[0]?.id;
        setStatus('UPLOADING');

        try {
            const result = await importFromCSV(file, targetWalletId);
            setStatus('SUCCESS');
            setMessage(result.message || t('transactions.import.success', { count: result.count }));
            await dispatch(refreshFinanceData());

            setTimeout(() => {
                handleClose();
            }, 1200);
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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t('transactions.import.title')}>
            <div className="space-y-6">
                <div>
                    <label htmlFor="import-default-wallet" className="mb-1 block text-sm font-medium">
                        {t('transactions.import.selectWallet')}
                    </label>
                    <select
                        id="import-default-wallet"
                        className="h-10 w-full rounded-md border bg-background px-3"
                        value={defaultWalletId}
                        onChange={(event) => setDefaultWalletId(event.target.value)}
                    >
                        {contextWallets.length === 0 && (
                            <option value="" disabled>
                                {t('transactions.import.noWallets')}
                            </option>
                        )}
                        {contextWallets.map((wallet) => (
                            <option key={wallet.id} value={wallet.id}>
                                {wallet.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:bg-muted/50"
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
                            <FileType className="mb-2 h-10 w-10 text-blue-500" />
                            <p className="font-medium">{file.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                            <p className="font-medium">{t('transactions.import.pickFile')}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t('transactions.import.pickFileDesc')}
                            </p>
                        </div>
                    )}
                </div>

                {status === 'ERROR' && (
                    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>{message}</p>
                    </div>
                )}

                {status === 'SUCCESS' && (
                    <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-600">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <p>{message}</p>
                    </div>
                )}

                <div className="flex justify-end gap-3 border-t pt-4">
                    <Button variant="outline" onClick={handleClose} disabled={status === 'UPLOADING'}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!file || status === 'UPLOADING' || contextWallets.length === 0}
                        className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
                    >
                        {status === 'UPLOADING' ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('transactions.import.uploading')}
                            </>
                        ) : (
                            t('transactions.import.submit')
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
