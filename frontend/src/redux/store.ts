import { configureStore } from '@reduxjs/toolkit'
import { authReducer } from './slices/authSlice'
import { loadPersistedAuth, persistAuth } from './persist'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: loadPersistedAuth(),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

store.subscribe(() => {
  persistAuth(store.getState())
})

