/**
 * auth.js 类型声明（配合 strict 模式，风格对齐 settings/apiConfig）
 */
export interface AuthUser {
    id: string
    username: string
}

export interface AuthStore {
    loggedIn: { value: boolean }
    user: { value: AuthUser | null }
    ready: { value: boolean }
    login: (username: string, password: string) => Promise<void>
    register: (username: string, password: string) => Promise<void>
    logout: () => void
}

export const AUTH_CHANGED_EVENT: string
export function useAuthStore(): AuthStore