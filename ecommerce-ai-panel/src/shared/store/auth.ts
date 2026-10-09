import { Store } from '@tanstack/store'
import type { User } from '@/shared/types/user'
import { runAfterLogout, setAuthCallbacks } from '@/shared/api/auth-bridge'
import { queryClient } from '@/providers/query/query-client'

type AuthState = {
    user: User | null
    /** Access yalnızca memory — storage'a yazılmaz */
    token: string | null
    loading: boolean
    initialLoading: boolean
    error?: string
}

const initialState: AuthState = {
    user: null,
    token: null,
    loading: false,
    initialLoading: true,
}

export const authStore = new Store(initialState)

export const authActions = {
    setUser: (user: User | null) => {
        authStore.setState((prev) => ({ ...prev, user }))
    },
    setToken: (token: string | null) => {
        authStore.setState((prev) => ({ ...prev, token }))
    },
    setTokens: (tokens: { access: string }) => {
        authStore.setState((prev) => ({
            ...prev,
            token: tokens.access,
        }))
    },
    setLoading: (loading: boolean) => {
        authStore.setState((prev) => ({ ...prev, loading }))
    },
    setInitialLoading: (initialLoading: boolean) => {
        authStore.setState((prev) => ({ ...prev, initialLoading }))
    },
    setError: (error?: string) => {
        authStore.setState((prev) => ({ ...prev, error }))
    },
    clearError: () => {
        authStore.setState((prev) => ({ ...prev, error: undefined }))
    },
    logout: () => {
        authStore.setState((prev) => ({
            ...prev,
            user: null,
            token: null,
            loading: false,
            initialLoading: false,
            error: undefined,
        }))
        queryClient.clear()
        runAfterLogout()
    },
}

setAuthCallbacks({
    getToken: () => authStore.state.token,
    getRefreshToken: () => null,
    setTokens: (tokens: { access: string; refresh?: string }) => {
        authActions.setTokens({ access: tokens.access })
    },
    logout: () => {
        authActions.logout()
    },
})
