import type { User, AuthState } from '~/types'

const LS_KEY = 'mahjong_tracker_auth'

export const useAuth = () => {
  const supabase = useSupabase()

  const authState = useState<AuthState>('auth', () => ({
    userId: null,
    userName: null,
  }))

  const initAuth = () => {
    if (!import.meta.client) return
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) {
        authState.value = JSON.parse(stored) as AuthState
      }
    } catch {
      localStorage.removeItem(LS_KEY)
    }
  }

  const login = (user: User) => {
    const state: AuthState = { userId: user.id, userName: user.name }
    authState.value = state
    if (import.meta.client) {
      localStorage.setItem(LS_KEY, JSON.stringify(state))
    }
  }

  const logout = () => {
    authState.value = { userId: null, userName: null }
    if (import.meta.client) {
      localStorage.removeItem(LS_KEY)
    }
  }

  const fetchUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name')

    if (error) {
      console.error('[useAuth] fetchUsers:', error)
      return []
    }
    return data as User[]
  }

  const createUser = async (name: string, iconUrl?: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .insert({ name, icon_url: iconUrl ?? null })
      .select()
      .single()

    if (error) {
      console.error('[useAuth] createUser:', error)
      return null
    }
    return data as User
  }

  const isLoggedIn = computed(() => !!authState.value.userId)
  const currentUserId = computed(() => authState.value.userId)
  const currentUserName = computed(() => authState.value.userName)

  return {
    authState: readonly(authState),
    isLoggedIn,
    currentUserId,
    currentUserName,
    initAuth,
    login,
    logout,
    fetchUsers,
    createUser,
  }
}
