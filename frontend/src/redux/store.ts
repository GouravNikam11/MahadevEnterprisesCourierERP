import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { authReducer } from './slices/authSlice'
import { loadPersistedAuth, persistAuth } from './persist'

const rootReducer = combineReducers({
  auth: authReducer,
})

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = ReturnType<typeof configureStore<RootState>>['dispatch']

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadPersistedAuth(),
})

store.subscribe(() => {
  persistAuth(store.getState())
})
