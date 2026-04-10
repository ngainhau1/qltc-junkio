import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

const initialState = {
    activeFamilyId: null,
    families: [],
    loading: false,
    error: null,
};

const normalizeFamily = (family) => ({
    ...family,
    members: Array.isArray(family?.members)
        ? family.members
        : Array.isArray(family?.Members)
            ? family.Members
            : [],
    my_role: family?.my_role || family?.role || null,
});

export const fetchFamilies = createAsyncThunk(
    'families/fetchFamilies',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/families');
            return Array.isArray(response.data) ? response.data.map(normalizeFamily) : [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'FAMILY_LOAD_FAILED');
        }
    }
);

export const createFamily = createAsyncThunk(
    'families/createFamily',
    async (familyData, { rejectWithValue }) => {
        try {
            const response = await api.post('/families', familyData);
            return normalizeFamily(response.data);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'FAMILY_CREATE_FAILED');
        }
    }
);

export const loadFamilyDetails = createAsyncThunk(
    'families/loadFamilyDetails',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/families/${id}`);
            return normalizeFamily(response.data);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'FAMILY_DETAIL_FAILED');
        }
    }
);

export const inviteMember = createAsyncThunk(
    'families/inviteMember',
    async ({ familyId, email, role }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/families/${familyId}/members`, { email, role });
            return { familyId, member: response.data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'FAMILY_INVITE_FAILED');
        }
    }
);

export const removeMemberFromFamily = createAsyncThunk(
    'families/removeMember',
    async ({ familyId, userId }, { rejectWithValue }) => {
        try {
            await api.delete(`/families/${familyId}/members/${userId}`);
            return { familyId, userId };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'FAMILY_REMOVE_FAILED');
        }
    }
);

const familySlice = createSlice({
    name: 'families',
    initialState,
    reducers: {
        setActiveFamily: (state, action) => {
            state.activeFamilyId = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFamilies.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFamilies.fulfilled, (state, action) => {
                state.loading = false;
                state.families = action.payload;
            })
            .addCase(fetchFamilies.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createFamily.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createFamily.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createFamily.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(loadFamilyDetails.fulfilled, (state, action) => {
                const family = normalizeFamily(action.payload);
                const index = state.families.findIndex((item) => item.id === family.id);
                if (index !== -1) {
                    state.families[index] = { ...state.families[index], ...family };
                }
            })
            .addCase(inviteMember.fulfilled, (state, action) => {
                const { familyId, member } = action.payload;
                const family = state.families.find((item) => item.id === familyId);
                if (family) {
                    family.members = Array.isArray(family.members) ? family.members : [];
                    family.members.push(member);
                }
            })
            .addCase(removeMemberFromFamily.fulfilled, (state, action) => {
                const { familyId, userId } = action.payload;
                const family = state.families.find((item) => item.id === familyId);
                if (family) {
                    family.members = (family.members || []).filter((member) => member.id !== userId);
                }
            });
    },
});

export const { setActiveFamily } = familySlice.actions;
export default familySlice.reducer;
