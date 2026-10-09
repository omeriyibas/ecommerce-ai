import { configureStore } from '@reduxjs/toolkit'
import uiReducer from '@/features/ui/model/slice.tsx'

export const store = configureStore({
    reducer: {
        ui: uiReducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
