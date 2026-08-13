const API_URL = 'http://localhost:3000/api'

export type User = {
  user_id: number
  name: string
  username?: string
  avatar: string | null
}

export type Message = {
  message_id: number
  message: string
  time_send: string
  user_id: number
  name: string
  avatar: string | null
}

export type LoginResponse = {
  message: string
  token: string
  user: User
}

export type SentMessage = Message

const request = async <T>(url: string): Promise<T> => {
  const res = await fetch(`${API_URL}${url}`)

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const getUsers = () => request<User[]>('/users')
export const getChats = () => request<unknown[]>('/chats')
export const getMessages = (chatId: number) => request<Message[]>(`/chats/${chatId}/messages`)

export const login = async (username: string, password: string) => {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const data = (await res.json()) as LoginResponse & { message?: string }

  if (!res.ok) {
    throw new Error(data.message ?? `Request failed: ${res.status}`)
  }

  return data
}

export const sendMessage = async (chatId: number, userId: number, message: string) => {
  const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, message }),
  })

  const data = (await res.json()) as SentMessage & { error?: string; message?: string }

  if (!res.ok) {
    throw new Error(data.error ?? data.message ?? `Request failed: ${res.status}`)
  }

  return data
}
