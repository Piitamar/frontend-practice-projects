import { getAuthToken } from '../../auth/clientAuth'

const API_URL = 'http://localhost:3001/api'

const request = async (url, options = {}) => {
  const headers = new Headers(options.headers)
  const token = getAuthToken()

  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_URL}${url}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed: ${res.status}`)
  }

  return data
}

export const getRooms = () => request('/rooms')
export const getUsers = () => request('/users')
export const getRoomMembers = (roomId) => request(`/rooms/${roomId}/members`)
export const getRoomMessages = (roomId) => request(`/rooms/${roomId}/messages`)
export const joinRoom = (roomId) => request(`/rooms/${roomId}/members`, { method: 'POST' })
