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
    const [joinNotice, setJoinNotice] = useState('')

    const [socketConnected, setSocketConnected] = useState(false)
    
    //tin nhắn
    const [message, setMessage] = useState('')
    //hàm gửi tin nhắn
    const sendMessage = (e) => {
        e.preventDefault()

        if (!message.trim() || !currentUser || !activeRoomId) return

        socketRef.current?.send(JSON.stringify({
            type: 'send_message',
            room_id: activeRoomId,
            user_id: currentUser.user_id,
            message: message.trim(),
        }))

        setMessage('')
    }

    const socketRef = useRef(null)
    const activeRoomIdRef = useRef(null)
    const noticeTimeoutRef = useRef(null)

    // Load rooms and users
    useEffect(() => {
        Promise.all([getRooms(), getUsers()])
            .then(([rooms, users]) => {
                setRooms(rooms)
                setUsers(users)
            })
            .catch(() => setRoomError('Could not load rooms.'))
    }, [])

    // Update user when auth changes
    useEffect(() => onAuthChange(() => setCurrentUser(readAuthUser())), [])

    // Keep the active room available to WebSocket events
    useEffect(() => {
        activeRoomIdRef.current = activeRoomId
    }, [activeRoomId])

    // Connect WebSocket
    useEffect(() => {
        const socket = new WebSocket('ws://localhost:3001')
        socketRef.current = socket

        socket.onopen = () => {
            console.log('WS CONNECTED')
            setSocketConnected(true)
        }

        socket.onmessage = ({ data }) => {
            const event = JSON.parse(data)

            // Có người mới vào room
            if (
                event.type === 'room_member_joined' &&
                activeRoomIdRef.current === event.member.room_id
            ) {
                const member = event.member
                const name = member.name || member.username || `User ${member.user_id}`

                setJoinNotice(`${name} joined this room.`)

                setRoomMembers((members) =>
                    members.some((m) => m.user_id === member.user_id)
                        ? members
                        : [...members, member]
                )
                console.log('room_member_joined', member)

                clearTimeout(noticeTimeoutRef.current)
                noticeTimeoutRef.current = setTimeout(() => setJoinNotice(''), 5000)

                return
            }

            // Nhận tin nhắn mới
            if (
                event.type === 'new_message' &&
                Number(activeRoomIdRef.current) === Number(event.message.room)
            ) {
                console.log('new_message', event.message)
                setMessages((messages) => [...messages, event.message])
            }
        }

        socket.onclose = () => setSocketConnected(false)
        socket.onerror = console.error

        return () => {
            clearTimeout(noticeTimeoutRef.current)
            socket.close()
            socketRef.current = null
        }
    }, [])

    // Tell the server which room this user joined
    useEffect(() => {
        if (!socketConnected || !activeRoomId || !currentUser) return

        socketRef.current?.send(JSON.stringify({
            type: 'join_room',
            room_id: activeRoomId,
            user_id: currentUser.user_id,
        }))
    }, [activeRoomId, currentUser, socketConnected])

    // Open an existing room
    const openRoom = async (room) => {
        if (!currentUser) {
            setRoomError('Log in before opening a room.')
            return
        }

        setLoadingRoom(true)
        setRoomError('')

        try {
            const data = await getRoomMessages(room.room_id)

            setActiveRoomId(room.room_id)
            setMessages(data.messages)
            setRoomMembers(data.members)
        } catch {
            setActiveRoomId(null)
            setMessages([])
            setRoomMembers([])
            setRoomError('Join this room to view its messages.')
        } finally {
            setLoadingRoom(false)
        }
    }

    // Join a room, then open it
    const onJoinRoom = async (room) => {
        if (!currentUser) {
            setRoomError('Log in before joining a room.')
            return
        }

        setLoadingRoom(true)
        setRoomError('')

        try {
            await joinRoom(room.room_id)
            await openRoom(room)
        } catch (error) {
            setRoomError(
                error instanceof Error
                    ? error.message
                    : 'Could not join this room. Please try again.'
            )
        } finally {
            setLoadingRoom(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
            <div className="mx-auto flex min-h-screen max-w-350flow-hidden bg-white shadow-[0_18px_70px_rgba(15,23,42,0.08)]">

                {/* Room list */}
                <aside className="w-64 shrink-0 border-r border-zinc-200 px-4 py-5">
                    <h1 className="mb-8 text-2xl font-semibold">Rooms</h1>

                    <nav className="space-y-2">
                        {rooms.map((room) => (
                            <div
                                key={room.room_id}
                                className={`flex items-center gap-2 rounded-xl px-3 py-2 ${activeRoomId === room.room_id ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                                    }`}
                            >
                                <button
                                    onClick={() => openRoom(room)}
                                    className="min-w-0 flex-1 px-1 py-1 text-left text-[18px]"
                                >
                                    {room.room_name}
                                </button>

                                <button
                                    onClick={() => onJoinRoom(room)}
                                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white"
                                >
                                    Join
                                </button>
                            </div>
                        ))}

                        {!rooms.length && (
                            <p className="px-2 text-sm text-zinc-500">No rooms found.</p>
                        )}
                    </nav>
                </aside>

                {/* Chat */}
                <section className="flex min-w-0 flex-1 flex-col">
                    <header className="flex h-16 items-center justify-end border-b border-zinc-200 px-5">
                        <span className="text-sm text-zinc-500">
                            {socketConnected ? 'Live' : 'Connecting...'} · {users.length} users
                        </span>
                    </header>

                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="h-132 overflow-y-auto px-6 py-4">
                            {joinNotice && (
                                <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                    {joinNotice}
                                </p>
                            )}

                            {loadingRoom ? (
                                <p className="text-sm text-zinc-500">Loading messages...</p>
                            ) : roomError ? (
                                <p className="text-sm text-zinc-500">{roomError}</p>
                            ) : !activeRoomId ? (
                                <p className="text-sm text-zinc-500">
                                    Select a room to view its chat.
                                </p>
                            ) : (
                                <>
                                    {/* Room members */}
                                    <div className="mb-5 fixed flex flex-wrap gap-2 pb-4">
                                        {roomMembers.map((member) => (
                                            <span
                                                key={member.user_id}
                                                className="rounded-full bg-zinc-100 px-3 py-1 text-sm"
                                            >
                                                {member.name || member.username}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Messages */}
                                    {!messages.length ? (
                                        <p className="text-sm text-zinc-500">No messages yet.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {messages.map((message) => (
                                                <article key={message.message_id} className="max-w-[75%]">
                                                    <p className="mb-1 text-sm font-medium">
                                                        {message.name || message.username}
                                                    </p>

                                                    <div className="rounded-xl bg-zinc-100 px-4 py-2">
                                                        {message.message}
                                                    </div>

                                                    <time className="mt-1 block text-xs text-zinc-400">
                                                        {new Date(message.time_send).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </time>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Message input */}
                        <div className="border-t border-zinc-200 px-5 py-4">
                            <form onSubmit={sendMessage} className="flex gap-2">
                                <input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write a message..."
                                    className="h-10 flex-1 rounded-lg border border-zinc-300 px-4 outline-none"
                                />

                                <button
                                    type="submit"
                                    className="rounded-lg bg-zinc-900 px-4 text-white"
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}
