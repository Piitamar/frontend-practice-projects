export type User = {
  user_id: number
  name: string
  username?: string
  avatar: string | null
}

export type LoginResponse = {
  message: string
  token: string
  user: User
}

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'
const AUTH_CHANGE_EVENT = 'auth-change'

export const getApiUrlForPath = (pathname: string) =>
  pathname.includes('/practice/counter-lab')
    ? 'http://localhost:3001/api'
    : 'http://localhost:3000/api'

export const getAuthToken = () => sessionStorage.getItem(TOKEN_KEY)

export const readAuthUser = () => {
  const authUser = sessionStorage.getItem(USER_KEY)
  if (!authUser) return null

  try {
    return JSON.parse(authUser) as User
  } catch {
    return null
  }
}

export const saveAuthSession = (data: LoginResponse) => {
  sessionStorage.setItem(TOKEN_KEY, data.token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user))
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

export const clearAuthSession = () => {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

export const onAuthChange = (handler: () => void) => {
  window.addEventListener(AUTH_CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export const login = async (
  apiUrl: string,
  username: string,
  password: string
) => {
  const res = await fetch(`${apiUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const data = await res.json() as LoginResponse & { error?: string }

  if (!res.ok) {
    throw new Error(data.error ?? data.message ?? `Request failed: ${res.status}`)
  }

  return data
}