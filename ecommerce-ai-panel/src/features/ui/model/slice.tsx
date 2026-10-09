import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface UiState {
    pageTitle: string
}

const initialState: UiState = {
    pageTitle: '',
}

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setPageTitle: (state, action: PayloadAction<string>) => {
            state.pageTitle = action.payload
        },
    },
})

export const { setPageTitle } = uiSlice.actions
export default uiSlice.reducer

