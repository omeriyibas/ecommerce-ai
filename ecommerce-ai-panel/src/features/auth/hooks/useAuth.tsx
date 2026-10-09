import { useCallback, useMemo } from 'react'
import { useStore } from '@tanstack/react-store'
import { authStore } from '@/shared/store/auth'
import {
    login as loginService,
    logout as logoutService,
    logoutAll as logoutAllService,
} from '@/services/auth.tsx'

export function useAuth() {
    const { user, token, loading, initialLoading, error } = useStore(
        authStore,
        (state) => state,
    )

    const isAuthenticated = !!token && !!user
    const role = user?.role ?? null

    const login = useCallback((email: string, password: string, rememberMe = false) => {
        return loginService({ email, password, rememberMe })
    }, [])

    const logout = useCallback(() => {
        return logoutService()
    }, [])

    const logoutAll = useCallback(() => {
        return logoutAllService()
    }, [])

    return useMemo(() => ({
        user, role, token, loading, initialLoading, error, isAuthenticated, login, logout, logoutAll,
    }), [user, role, token, loading, initialLoading, error, isAuthenticated, login, logout, logoutAll])
}
