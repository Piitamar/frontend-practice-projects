import { useEffect, useState } from "react";
import { getUsers, getMessages, sendMessage, type Message, type User } from "./connection";

export default function WebSocketPracticePage() {
  //state dùng cho thanh bên trái
  const [selectedUser, setSelectedUser] = useState<number>(1);

  //state cho lấy data
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  //STATE cho chat
  const [chatId, setChatId] = useState<number>(1);

  useEffect(() => {
    const loadUsers = async () => {
      const data = await getUsers();
      setUsers(data);
    };

    loadUsers();
  }, []);

  useEffect(() => {
    const authUser = localStorage.getItem("auth_user");

    if (!authUser) {
      setCurrentUser(null);
      return;
    }

    try {
      setCurrentUser(JSON.parse(authUser) as User);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const visibleUsers = users.filter((user) => user.user_id !== currentUser?.user_id);

  useEffect(() => {
    const loadMessages = async () => {
      const data = await getMessages(chatId);
      setMessages(data);
    };

    loadMessages();
  }, [chatId]);

  async function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draftMessage.trim();
    if (!content || !currentUser) return;

    setSending(true);
    setSendError("");

    try {
      const createdMessage = await sendMessage(chatId, currentUser.user_id, content);
      setMessages((prev) => [...prev, createdMessage]);
      setDraftMessage("");
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Không gửi được tin nhắn");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex">
      {/* Left: Chats */}
      <div className="w-72 border-r border-zinc-800 p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-4">Chats</h1>

        <input
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 mb-4 outline-none"
          placeholder="Search chats..."
        />

        <div className="space-y-1 overflow-y-auto">
          {visibleUsers.map((user) => (
            <button
              key={user.user_id}
              onClick={() => {
                setChatId(user.user_id);
                setSelectedUser(user.user_id);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition ${selectedUser === user.user_id
                ? "bg-zinc-800"
                : "hover:bg-zinc-900"
                }`}
            >
              <div className="size-10 rounded-full bg-purple-500 flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.name.slice(0, 2).toUpperCase()
                )}
              </div>

              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-zinc-400">Last message...</p>
              </div>
            </button>
          ))
          }
        </div>
      </div>

      {/* Center: Chat */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-800 px-6 flex items-center gap-3">
          <div className="size-10 rounded-full bg-purple-500 flex items-center justify-center">HV</div>
          <div><p className="font-semibold">Hà Vy</p><p className="text-xs text-green-400">● Online</p></div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.message_id}
              className={`flex ${msg.user_id === currentUser?.user_id ? "justify-end" : "justify-start"
                }`}
            >
              <div className="max-w-[70%]">
                <div
                  className={`px-4 py-2 rounded-2xl ${msg.user_id === currentUser?.user_id
                      ? "bg-purple-600 rounded-br-sm"
                      : "bg-zinc-800 rounded-bl-sm"
                    }`}
                >
                  {msg.message}
                </div>

                <p className="text-xs text-zinc-500 mt-1">
                  {new Date(msg.time_send).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        <form className="p-4 border-t border-zinc-800 flex gap-3" onSubmit={handleSendMessage}>
          <input
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={sending}
            className="px-5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
        {sendError ? <p className="px-4 pb-3 text-sm text-rose-400">{sendError}</p> : null}
      </main>

      {/* Right: Users */}
      <aside className="w-64 border-l border-zinc-800 p-4">
        <h2 className="text-xl font-bold mb-4">Users</h2>
        <input className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 mb-5 outline-none" placeholder="Search users..." />

        <p className="text-xs text-zinc-500 mb-3">ONLINE — 3</p>
        <div className="space-y-3">
          {["Hà Vy", "Linh Đan", "Minh Quân"].map((user) => (
            <div key={user} className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-purple-500 flex items-center justify-center text-xs">
                {user.slice(0, 2)}
              </div>
              <div>
                <p className="text-sm">{user}</p>
                <p className="text-xs text-green-400">Online</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div >
  )
}
