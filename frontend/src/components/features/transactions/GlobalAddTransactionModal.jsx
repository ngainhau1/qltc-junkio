import { useSelector, useDispatch } from 'react-redux';
import { Modal } from '@/components/ui/modal';
import { TransactionForm } from './TransactionForm';
import { closeAddTransactionModal } from '@/features/ui/uiSlice';
import { useTranslation } from 'react-i18next';

export function GlobalAddTransactionModal() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { isAddTransactionModalOpen } = useSelector((state) => state.ui);

    const handleClose = () => {
        dispatch(closeAddTransactionModal());
    };

    return (
        <Modal
            isOpen={isAddTransactionModalOpen}
            onClose={handleClose}
            title={t('transactionForm.title')}
        >
            <TransactionForm onSuccess={handleClose} />
        </Modal>
    );
}
