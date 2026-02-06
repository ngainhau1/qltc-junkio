import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isAddTransactionModalOpen: false,
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
    },
});

export const { openAddTransactionModal, closeAddTransactionModal, toggleAddTransactionModal } = uiSlice.actions;
export default uiSlice.reducer;
