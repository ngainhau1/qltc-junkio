import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    wallets: [],
    loading: false,
};

const walletSlice = createSlice({
    name: 'wallets',
    initialState,
    reducers: {
        setWallets: (state, action) => {
            state.wallets = action.payload;
        },
        addWallet: (state, action) => {
            // 1. Validate XOR Rule: Wallet cannot belong to both User and Family
            // 2. Validate Membership: Wallet must belong to EITHER User OR Family
            const { user_id, family_id } = action.payload;

            if (user_id && family_id) {
                console.error("XOR VIOLATION: Wallet cannot have both user_id and family_id");
                return; // Reject
            }
            if (!user_id && !family_id) {
                console.error("ORPHAN VIOLATION: Wallet must have either user_id or family_id");
                return; // Reject
            }

            state.wallets.push(action.payload);
        },
        updateWalletBalance: (state, action) => {
            const { id, amount } = action.payload;
            const wallet = state.wallets.find(w => w.id === id);
            if (wallet) {
                wallet.balance = (parseFloat(wallet.balance) + parseFloat(amount)).toFixed(2);
            }
        }
    },
});

export const { setWallets, addWallet, updateWalletBalance } = walletSlice.actions;
export default walletSlice.reducer;
