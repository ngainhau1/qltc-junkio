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
        addMember: (state, action) => {
            const { familyId, member } = action.payload;
            const family = state.families.find(f => f.id === familyId);
            if (family) {
                family.members.push(member);
            }
        },
        updateMemberRole: (state, action) => {
            const { familyId, memberId, newRole } = action.payload;
            const family = state.families.find(f => f.id === familyId);
            if (family) {
                const member = family.members.find(m => m.id === memberId);
                if (member) {
                    member.role = newRole;
                }
            }
        },
        removeMember: (state, action) => {
            const { familyId, memberId } = action.payload;
            const family = state.families.find(f => f.id === familyId);
            if (family) {
                family.members = family.members.filter(m => m.id !== memberId);
            }
        }
    },
});

export const { setActiveFamily, setFamilies, addFamily, addMember, updateMemberRole, removeMember } = familySlice.actions;
export default familySlice.reducer;
