import { useSelector, useDispatch } from 'react-redux';
import { Modal } from '@/components/ui/modal';
import { TransactionForm } from './TransactionForm';
import { closeAddTransactionModal } from '@/features/ui/uiSlice';

export function GlobalAddTransactionModal() {
    const dispatch = useDispatch();
    const { isAddTransactionModalOpen } = useSelector((state) => state.ui);

    const handleClose = () => {
        dispatch(closeAddTransactionModal());
    };

    return (
        <Modal
            isOpen={isAddTransactionModalOpen}
            onClose={handleClose}
            title="Thêm Giao Dịch Mới"
        >
            <TransactionForm onSuccess={handleClose} />
        </Modal>
    );
}
