import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    activeFamilyId: null, // For switching between Personal (null) and Family context
    families: [],
    members: [],
    loading: false,
};

const familySlice = createSlice({
    name: 'families',
    initialState,
    reducers: {
        setActiveFamily: (state, action) => {
            // action.payload: null (Personal) or family_id (Family)
            state.activeFamilyId = action.payload;
        },
        setFamilies: (state, action) => {
            state.families = action.payload;
        },
        addFamily: (state, action) => {
            state.families.push(action.payload);
        },
    },
});

export const { setActiveFamily, setFamilies, addFamily } = familySlice.actions;
export default familySlice.reducer;
