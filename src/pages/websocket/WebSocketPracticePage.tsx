import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  getChatIdForUsers,
  getUsers,
  getMessages,
  onAuthChange,
  readAuthUser,
  type Message,
  type User,
} from "./connection";

type ServerMessage =
  | {
      type: "connected";
      message?: string;
    }
  | {
      type: "new_message";
      message: Message;
    }
  | {
      type: "error";
      message: string;
    };

export default function WebSocketPracticePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => readAuthUser());

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const activeChatIdRef = useRef<number | null>(null);

  const [draftMessage, setDraftMessage] = useState("");

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendError, setSendError] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    return onAuthChange(() => {
      setCurrentUser(readAuthUser());
    });
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setSelectedUser(null);
      setChatId(null);
      setMessages([]);
      setDraftMessage("");
      setSendError("");
      setLoadingConversation(false);
    }
  }, [currentUser]);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUsers(true);
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Không lấy được users:", error);
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    console.log("Opening WebSocket...");

    const socket = new WebSocket("ws://localhost:3000");
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);

      socket.send(
        JSON.stringify({
          type: "identify",
          userId: currentUser.user_id,
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);

        if (data.type === "new_message") {
          const newMessage = data.message;

          if (
            activeChatIdRef.current === null ||
            newMessage.chat_id !== activeChatIdRef.current
          ) {
            return;
          }

          setMessages((prev) => {
            const alreadyExists = prev.some(
              (message) => message.message_id === newMessage.message_id
            );

            if (alreadyExists) {
              return prev;
            }

            return [...prev, newMessage];
          });

          return;
        }

        if (data.type === "error") {
          console.error("WebSocket server error:", data.message);
          setSendError(data.message);
          return;
        }

        if (data.type === "connected") {
          console.log("Server:", data.message);
        }
      } catch (error) {
        console.error("Không parse được WebSocket message:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    return () => {
      console.log("Closing WebSocket");
      socket.close();
      wsRef.current = null;
    };
  }, [currentUser]);

  useEffect(() => {
    if (chatId === null) {
      activeChatIdRef.current = null;
      setMessages([]);
      return;
    }

    const activeChatId = chatId;
    activeChatIdRef.current = activeChatId;

    async function loadMessages() {
      try {
        setLoadingMessages(true);
        const data = await getMessages(activeChatId);
        setMessages(data);
      } catch (error) {
        console.error("Không lấy được messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadMessages();
  }, [chatId]);

  function handleSelectUser(user: User) {
    setSelectedUser(user);
    setSendError("");
  }

  useEffect(() => {
    let cancelled = false;

    async function resolveConversation() {
      if (!currentUser || !selectedUser) {
        setChatId(null);
        setLoadingConversation(false);
        return;
      }

      setLoadingConversation(true);
      setMessages([]);
      setLoadingMessages(false);
      setSendError("");

      try {
        const data = await getChatIdForUsers(
          currentUser.user_id,
          selectedUser.user_id
        );

        if (cancelled) return;

        setChatId(data.chatId);
      } catch (error) {
        if (cancelled) return;

        console.error("Không tìm được hội thoại:", error);
        setChatId(null);
        setSendError("Không tìm thấy hội thoại của cặp người này");
      } finally {
        if (!cancelled) {
          setLoadingConversation(false);
        }
      }
    }

    resolveConversation();

    return () => {
      cancelled = true;
    };
  }, [currentUser, selectedUser]);

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draftMessage.trim();

    if (!content) return;

    if (!currentUser) {
      setSendError("Bạn chưa đăng nhập");
      return;
    }

    if (!selectedUser) {
      setSendError("Hãy chọn một người để chat");
      return;
    }

    const socket = wsRef.current;

    if (!socket) {
      setSendError("WebSocket chưa được khởi tạo");
      return;
    }

    if (socket.readyState !== WebSocket.OPEN) {
      setSendError("WebSocket chưa kết nối");
      return;
    }

    if (chatId === null) {
      setSendError("Chưa xác định được hội thoại");
      return;
    }

    setSendError("");

    socket.send(
      JSON.stringify({
        type: "send_message",
        chatId,
        senderId: currentUser.user_id,
        receiverId: selectedUser.user_id,
        message: content,
      })
    );

    setDraftMessage("");
  }

  const visibleUsers = users.filter(
    (user) => user.user_id !== currentUser?.user_id
  );

  return (
    <div className="h-screen bg-zinc-950 text-white flex">
      <div className="w-72 border-r border-zinc-800 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Chats</h1>

          <div className="flex items-center gap-2 text-xs">
            <span
              className={`size-2 rounded-full ${
                isConnected ? "bg-green-400" : "bg-red-400"
              }`}
            />
            {isConnected ? "Connected" : "Disconnected"}
          </div>
        </div>

        <input
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 mb-4 outline-none focus:border-purple-500"
          placeholder="Search chats..."
        />

        <div className="space-y-1 overflow-y-auto">
          {loadingUsers ? (
            <p className="text-sm text-zinc-500">Loading users...</p>
          ) : (
            visibleUsers.map((user) => (
              <button
                key={user.user_id}
                onClick={() => handleSelectUser(user)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition ${
                  selectedUser?.user_id === user.user_id
                    ? "bg-zinc-800"
                    : "hover:bg-zinc-900"
                }`}
              >
                <div className="size-10 shrink-0 rounded-full bg-purple-500 flex items-center justify-center overflow-hidden">
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

                <div className="min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-zinc-400">Click to chat</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-zinc-800 px-6 flex items-center gap-3">
          {selectedUser ? (
            <>
              <div className="size-10 rounded-full bg-purple-500 flex items-center justify-center overflow-hidden">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  selectedUser.name.slice(0, 2).toUpperCase()
                )}
              </div>

              <div>
                <p className="font-semibold">{selectedUser.name}</p>
                <p className="text-xs text-green-400">● Online</p>
              </div>
            </>
          ) : (
            <p className="text-zinc-500">Select a chat</p>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!selectedUser ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-zinc-400">
                  Select a user to start chatting
                </p>
              </div>
            </div>
          ) : loadingConversation || loadingMessages ? (
            <div className="text-zinc-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-zinc-500">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.user_id === currentUser?.user_id;

              return (
                <div
                  key={msg.message_id}
                  className={`flex ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-[70%]">
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isMine
                          ? "bg-purple-600 rounded-br-sm"
                          : "bg-zinc-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.message}
                    </div>

                    <p
                      className={`text-xs text-zinc-500 mt-1 ${
                        isMine ? "text-right" : "text-left"
                      }`}
                    >
                      {new Date(msg.time_send).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          className="p-4 border-t border-zinc-800 flex gap-3"
          onSubmit={handleSendMessage}
        >
          <input
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            disabled={!selectedUser}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-purple-500 disabled:opacity-50"
            placeholder={
              selectedUser ? "Type a message..." : "Select a chat first..."
            }
          />

          <button
            type="submit"
            disabled={
              !selectedUser ||
              !draftMessage.trim() ||
              !isConnected ||
              chatId === null
            }
            className="px-5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>

        {sendError ? (
          <p className="px-4 pb-3 text-sm text-rose-400">{sendError}</p>
        ) : null}
      </main>

      <aside className="w-64 border-l border-zinc-800 p-4">
        <h2 className="text-xl font-bold mb-4">Users</h2>

        <input
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 mb-5 outline-none"
          placeholder="Search users..."
        />

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
    </div>
  );
}
