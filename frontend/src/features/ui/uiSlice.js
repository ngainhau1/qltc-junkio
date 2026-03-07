import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isAddTransactionModalOpen: false,
    isImportModalOpen: false,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        openAddTransactionModal: (state) => {
            state.isAddTransactionModalOpen = true;
        },
        closeAddTransactionModal: (state) => {
            state.isAddTransactionModalOpen = false;
        },
        toggleAddTransactionModal: (state) => {
            state.isAddTransactionModalOpen = !state.isAddTransactionModalOpen;
        },
        openImportModal: (state) => {
            state.isImportModalOpen = true;
        },
        closeImportModal: (state) => {
            state.isImportModalOpen = false;
        },
    },
});

export const {
    openAddTransactionModal,
    closeAddTransactionModal,
    toggleAddTransactionModal,
    openImportModal,
    closeImportModal
} = uiSlice.actions;
export default uiSlice.reducer;
