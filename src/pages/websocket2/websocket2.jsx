import { useEffect, useRef, useState } from 'react'

import { getRooms, getUsers, getRoomMessages, joinRoom } from './connection.js'
import { onAuthChange, readAuthUser } from '../../auth/clientAuth'

export default function Websocket2Page() {
    const [rooms, setRooms] = useState([])
    const [users, setUsers] = useState([])
    const [currentUser, setCurrentUser] = useState(() => readAuthUser())
    const [activeRoomId, setActiveRoomId] = useState(null)
    const [messages, setMessages] = useState([])
    const [roomMembers, setRoomMembers] = useState([])
    const [loadingRoom, setLoadingRoom] = useState(false)
    const [roomError, setRoomError] = useState('')
    const socketRef = useRef(null)

    useEffect(() => {
        Promise.all([getRooms(), getUsers()])
            .then(([roomData, userData]) => {
                setRooms(roomData)
                setUsers(userData)
            })
            .catch(() => setRoomError('Could not load rooms.'))
    }, [])

    useEffect(() => onAuthChange(() => setCurrentUser(readAuthUser())), [])

    const openRoom = async (room) => {
        if (!currentUser) {
            setRoomError('Log in before opening a room.')
            return
        }

        setLoadingRoom(true)
        setRoomError('')
        try {
            // The API verifies that this user has already joined the room.
            const conversation = await getRoomMessages(room.room_id)
            setActiveRoomId(room.room_id)
            setMessages(conversation.messages)
            setRoomMembers(conversation.members)
        } catch {
            setActiveRoomId(null)
            setMessages([])
            setRoomMembers([])
            setRoomError('Join this room to view its messages.')
        } finally {
            setLoadingRoom(false)
        }
    }

    const onJoinRoom = async (room) => {
        if (!currentUser) {
            setRoomError('Log in before joining a room.')
            return

        try {
            await joinRoom(room.room_id)
            await openRoom(room)
            socketRef.current?.send(JSON.stringify({
                type: 'join_room', room_id: room.room_id, user_id: currentUser.user_id,
            }))
        } catch {
            setRoomError('Could not join this room. Please try again.')
        }
    }

    return (
        <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
            <div className="mx-auto flex min-h-screen max-w-[1400px] overflow-hidden bg-white shadow-[0_18px_70px_rgba(15,23,42,0.08)]">
                <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white px-4 py-5">
                    <h1 className="mb-8 text-2xl font-semibold tracking-tight">Rooms</h1>
                    <nav className="space-y-2">
                        {rooms.map((room) => (
                            <div key={room.room_id} className={`flex items-center gap-2 rounded-xl px-3 py-2 transition ${activeRoomId === room.room_id ? 'bg-zinc-100 shadow-[0_1px_2px_rgba(15,23,42,0.06)]' : 'hover:bg-zinc-50'}`}>
                                <button type="button" onClick={() => openRoom(room)} className="min-w-0 flex-1 px-1 py-1 text-left text-[18px]">
                                    {room.room_name}
                                </button>
                                <button type="button" onClick={() => onJoinRoom(room)} className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700">
                                    Join
                                </button>
                            </div>
                        ))}
                        {rooms.length === 0 && <p className="px-2 text-sm text-zinc-500">No rooms found.</p>}
                    </nav>
                </aside>

                <section className="flex min-w-0 flex-1 flex-col">
                    <header className="flex h-16 items-center justify-end border-b border-zinc-200 px-5">
                        <span className="text-sm text-zinc-500">{users.length} users</span>
                    </header>
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {loadingRoom ? <p className="text-sm text-zinc-500">Loading messages...</p>
                                : roomError ? <p className="text-sm text-zinc-500">{roomError}</p>
                                    : !activeRoomId ? <p className="text-sm text-zinc-500">Select a room to view its chat.</p>
                                        : <>
                                            <div className="mb-5 flex flex-wrap gap-2 border-b border-zinc-100 pb-4">
                                                {roomMembers.map((member) => <span key={member.user_id} className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">{member.name || member.username}</span>)}
                                            </div>
                                            {messages.length === 0 ? <p className="text-sm text-zinc-500">No messages yet.</p>
                                                : <div className="space-y-4">
                                                    {messages.map((message) => <article key={message.message_id} className="max-w-[75%]">
                                                        <p className="mb-1 text-sm font-medium text-zinc-700">{message.name || message.username}</p>
                                                        <div className="rounded-xl bg-zinc-100 px-4 py-2 text-zinc-900">{message.message}</div>
                                                        <time className="mt-1 block text-xs text-zinc-400">{new Date(message.time_send).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                                                    </article>)}
                                                </div>}
                                        </>}
                        </div>
                        <div className="border-t border-zinc-200 bg-white px-5 py-4">
                            <div className="flex gap-2">
                                <input type="text" placeholder="Write a message..." className="h-10 flex-1 rounded-lg border border-zinc-300 px-4 text-[16px] text-zinc-900 outline-none transition focus:border-zinc-500" />
                                <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-[16px] font-medium text-white transition hover:bg-zinc-800">Send</button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}
