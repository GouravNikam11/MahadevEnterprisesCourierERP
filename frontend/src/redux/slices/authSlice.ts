import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: { id: string; email: string; name?: string | null; role: string } | null
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
}

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (
      state,
      action: PayloadAction<{
        accessToken: string
        refreshToken?: string
        user: { id: string; email: string; name?: string | null; role: string }
      }>,
    ) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken ?? null
      state.user = action.payload.user
    },
    clearSession: (state) => {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
    },
  },
})

export const { setSession, clearSession } = slice.actions
export const authReducer = slice.reducer

