import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// Define the User interface to match your backend schema
interface User {
    _id: string;
    username: string;
    email: string;
    role: "reader" | "writer" | "admin";
    avatar?: string;
    bio?: string;
    writerBadge?: boolean;
    expertise?: string[];
    createdAt: string;
    lastLoginAt?: string;
}

interface AccountState {
    currentUser: User | null;
    loading: boolean;
    error: string | null;
}

const initialState: AccountState = {
    currentUser: null,
    loading: false,
    error: null,
};

const accountSlice = createSlice({
    name: "account",
    initialState,
    reducers: {
        setCurrentUser: (state, action: PayloadAction<User | null>) => {
            state.currentUser = action.payload;
            state.error = null;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.loading = false;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearUser: (state) => {
            state.currentUser = null;
            state.error = null;
        },
    },
});

export const { setCurrentUser, setLoading, setError, clearError, clearUser } = accountSlice.actions;
export default accountSlice.reducer;