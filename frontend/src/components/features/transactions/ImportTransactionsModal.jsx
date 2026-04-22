import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, FileType, Loader2, Upload } from 'lucide-react';
import { getFinanceScopeLabels } from '@/features/finance/context';
import { importFromFile } from '@/services/importService';
import { refreshFinanceData } from '@/features/finance/refreshFinanceData';
import { extractErrorCode, resolveError } from '@/utils/authErrors';

export function ImportTransactionsModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [defaultWalletId, setDefaultWalletId] = useState('');
    const [status, setStatus] = useState('IDLE');
    const [message, setMessage] = useState('');

    const { wallets } = useSelector((state) => state.wallets);
    const { categories } = useSelector((state) => state.categories);
    const { activeFamilyId, families } = useSelector((state) => state.families);

    const contextWallets = wallets.filter((wallet) => (activeFamilyId ? wallet.family_id === activeFamilyId : !wallet.family_id));
    const financeScope = getFinanceScopeLabels(t, {
        activeFamilyId: activeFamilyId ?? null,
        families: families ?? [],
    });

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        const name = selectedFile?.name?.toLowerCase() || '';
        const isCSV = selectedFile?.type === 'text/csv' || name.endsWith('.csv');
        const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');

        if (selectedFile && (isCSV || isExcel)) {
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
            const result = await importFromFile(file, targetWalletId, wallets, categories);
            setStatus('SUCCESS');
            setMessage(t('transactions.import.success', { count: result.count }));
            await dispatch(refreshFinanceData());

            setTimeout(() => {
                handleClose();
            }, 1200);
        } catch (error) {
            setStatus('ERROR');
            setMessage(resolveError(extractErrorCode(error), t, 'errors.transactions.importFailed'));
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
                <div className="rounded-md border bg-muted/30 px-3 py-2" data-testid="import-scope">
                    <p className="text-xs font-medium text-muted-foreground">{t('transactions.context.scopeLabel')}</p>
                    <p className="text-sm font-medium">{financeScope.scopeTargetLabel}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {financeScope.scope === 'family'
                            ? t('transactions.context.familyHint', { target: financeScope.scopeTargetLabel })
                            : t('transactions.context.personalHint')}
                    </p>
                </div>

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
                    <p className="mt-1 text-xs text-muted-foreground">{t('transactions.context.walletHint')}</p>
                </div>

                <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:bg-muted/50 sm:p-8"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
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

                <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={handleClose} disabled={status === 'UPLOADING'} className="w-full sm:w-auto">
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!file || status === 'UPLOADING' || contextWallets.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-700 sm:min-w-[120px] sm:w-auto"
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
