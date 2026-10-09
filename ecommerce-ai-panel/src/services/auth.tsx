import { toast } from 'sonner'
import type {
    LoginCredentials,
    LoginResponse,
} from '@/features/auth/types'
import api from '@/shared/api/client'
import { refreshAccessToken } from '@/shared/api/refresh'
import { authActions } from '@/shared/store/auth'
import type { User } from '@/shared/types/user'

export async function login(credentials: LoginCredentials): Promise<void> {
    authActions.setLoading(true)
    authActions.setError(undefined)

    try {
        const { email, password, rememberMe = false } = credentials
        const { data } = await api.post<LoginResponse>('/auth/login', {
            email,
            password,
            remember_me: rememberMe,
        })
        authActions.setUser(data.user)
        authActions.setTokens({ access: data.token.access_token })
        authActions.setLoading(false)
    } catch (error: any) {
        const message = error.message ?? error.response?.data?.message ?? 'Giriş başarısız'
        authActions.setError(message)
        authActions.setLoading(false)
        throw error
    }
}

export async function logout(): Promise<void> {
    try {
        await api.post('/auth/logout', {})
    } catch {
        /* Sunucu iptali başarısız olsa da yerel oturum kapatılır */
    }
    authActions.logout()
    toast.success('Çıkış yapıldı')
}

export async function logoutAll(): Promise<void> {
    try {
        await api.post('/auth/logout-all')
    } catch {
        /* yerel temizlik yine yapılır */
    }
    authActions.logout()
    toast.success('Tüm oturumlar sonlandırıldı')
}

export async function forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email })
}

export async function changePassword(
    currentPassword: string,
    newPassword: string,
): Promise<void> {
    await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
    })
    authActions.logout()
    toast.success('Şifre güncellendi. Lütfen tekrar giriş yapın.')
}

/** Boot: refresh cookie → access (memory) → /me */
export async function bootstrapSession(): Promise<User | null> {
    authActions.setInitialLoading(true)
    authActions.setError(undefined)
    try {
        const access = await refreshAccessToken()
        if (!access) {
            authActions.setInitialLoading(false)
            return null
        }
        return await fetchUser()
    } catch {
        authActions.setToken(null)
        authActions.setUser(null)
        authActions.setInitialLoading(false)
        return null
    }
}

export async function fetchUser(): Promise<User> {
    authActions.setInitialLoading(true)
    authActions.setError(undefined)

    try {
        const { data } = await api.get<User>('/auth/me')
        authActions.setUser(data)
        authActions.setInitialLoading(false)
        return data
    } catch (error: any) {
        const message =
            (typeof error?.message === 'string' && error.message) ||
            (typeof error?.response?.data?.detail === 'string'
                ? error.response.data.detail
                : null) ||
            'Kullanıcı bilgileri alınamadı'
        authActions.setError(message)
        authActions.setInitialLoading(false)

        authActions.setToken(null)

        throw error
    }
}
