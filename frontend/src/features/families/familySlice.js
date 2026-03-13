import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

const initialState = {
    activeFamilyId: null, // For switching between Personal (null) and Family context
    families: [],
    loading: false,
    error: null,
};

// --- Async Thunks ---
export const fetchFamilies = createAsyncThunk(
    'families/fetchFamilies',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/families');
            return response.data; // array of families
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải danh sách gia đình');
        }
    }
);

export const createFamily = createAsyncThunk(
    'families/createFamily',
    async (familyData, { rejectWithValue }) => {
        try {
            const response = await api.post('/families', familyData);
            return response.data; // newly created family object
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi khi tạo gia đình');
        }
    }
);

export const loadFamilyDetails = createAsyncThunk(
    'families/loadFamilyDetails',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/families/${id}`);
            return response.data; // Family Details with Members & Wallets
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải chi tiết gia đình');
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
            return rejectWithValue(error.response?.data?.message || 'Lỗi mời thành viên');
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
            return rejectWithValue(error.response?.data?.message || 'Lỗi xóa thành viên');
        }
    }
);

const familySlice = createSlice({
    name: 'families',
    initialState,
    reducers: {
        setActiveFamily: (state, action) => {
            // action.payload: null (Personal) or family_id (Family)
            state.activeFamilyId = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Families
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
            // Create Family
            .addCase(createFamily.pending, (state) => {
                state.loading = true;
            })
            .addCase(createFamily.fulfilled, (state, action) => {
                state.loading = false;
                state.families.push(action.payload);
            })
            .addCase(createFamily.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Load Family Details (Optional behavior depending on UI need)
            .addCase(loadFamilyDetails.fulfilled, (state, action) => {
                const family = action.payload;
                const index = state.families.findIndex(f => f.id === family.id);
                if (index !== -1) {
                    // Update existing family with full details
                    state.families[index] = { ...state.families[index], ...family };
                }
            })
            // Invite Member
            .addCase(inviteMember.fulfilled, (state, action) => {
                const { familyId, member } = action.payload;
                const family = state.families.find(f => f.id === familyId);
                if (family) {
                    if (!family.Members) family.Members = [];
                    family.Members.push(member);
                }
            })
            // Remove Member
            .addCase(removeMemberFromFamily.fulfilled, (state, action) => {
                const { familyId, userId } = action.payload;
                const family = state.families.find(f => f.id === familyId);
                if (family && family.Members) {
                    family.Members = family.Members.filter(m => m.id !== userId);
                }
            });
    },
});

export const { setActiveFamily } = familySlice.actions;
export default familySlice.reducer;
