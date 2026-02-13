"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NotAuthenticated } from "@repo/ui/not-authenticated";

type Conversation = {
  id: string;
  participants: { id: string; name?: string }[];
  unreadCount?: number;
  lastMessage?: string | null;
};

type Message = {
  id: string;
  clientId?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  readBy?: string[];
  status?: "sending" | "sent" | "failed";
};

/**
 * Performs  chat page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function ChatPage() {
  const [personal, setPersonal] = useState<Conversation[]>([]);
  const [familyChat, setFamilyChat] = useState<Conversation | null>(null);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingAcks = useRef<Map<string, number>>(new Map());
  const typingTimer = useRef<number | null>(null);
  const pendingAckTimeoutMs = 8000;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

  function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  function getUserId() {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1]!));
      return payload.userId || payload.id || null;
    } catch (err) {
      console.error("Failed to decode token:", err);
      return null;
    }
  }

  const meId = getUserId();
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const fetchChats = useCallback(async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/chat`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const js = await res.json();
    setPersonal(js.data.personal || []);
    setFamilyChat(js.data.familyChat || null);
  }, [API_BASE]);

  useEffect(() => {
      setHydrated(true);
      const savedToken = localStorage.getItem("token");
      setToken(savedToken);
    }, []);
    
  useEffect(() => {
    void fetchChats();
    // connect WS
    const token = getToken();
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://${window.location.hostname}:3002/?token=${encodeURIComponent(
      token || "",
    )}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.addEventListener('open', () => {
      if (token) {
        try {
          ws.send(JSON.stringify({ type: 'auth', token }));
        } catch (e) {
          console.error('Failed to send auth message', e);
        }
      }
    });

    ws.addEventListener("message", (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "chat_message") {
          setMessages((m) => {
            // if incoming message has clientId that matches local optimistic, replace it
            if (data.message?.clientId) {
              return m.map((msg) => (msg.clientId === data.message.clientId ? { ...data.message, status: "sent" } : msg));
            }
            return [...m, data.message];
          });
          // scroll
          setTimeout(() => scrollToBottom(), 50);
        } else if (data.type === "ack") {
          // ack for sent message -> reconcile optimistic message using clientId
          if (data.clientId) {
            setMessages((ms) =>
              ms.map((msg) =>
                msg.clientId === data.clientId
                  ? { ...msg, id: data.messageId ?? msg.id, status: data.status === "ok" ? "sent" : "failed", createdAt: data.createdAt ?? msg.createdAt }
                  : msg,
              ),
            );
            const to = pendingAcks.current.get(data.clientId);
            if (to) {
              clearTimeout(to);
              pendingAcks.current.delete(data.clientId);
            }
            // scroll
            setTimeout(() => scrollToBottom(), 50);
          }
        } else if (data.type === "typing") {
          setTypingUsers((t) => ({ ...t, [data.userId]: !!data.typing }));
        } else if (data.type === "read_receipt") {
          const { messageId, userId } = data;
          setMessages((ms) =>
            ms.map((msg) => (msg.id === messageId ? { ...msg, readBy: [...(msg.readBy || []), userId] } : msg)),
          );
        }
      } catch (err) {
        console.error("WS parse error", err);
      }
    });

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [fetchChats]);

  async function loadConversation(conv: Conversation) {
    setSelected(conv);
    setMessages([]);
    const token = getToken();
    const res = await fetch(`${API_BASE}/messages/conversations/${conv.id}/messages?limit=50`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const js = await res.json();
    setMessages(js.data || []);

    // mark unread messages as read via WS
    const unread = js.data.filter((m: Message) => !(m.readBy || []).includes(meId || ""));
    for (const m of unread) {
      try {
        wsRef.current?.send(
          JSON.stringify({
            type: "read",
            conversationId: conv.id,
            messageId: m.id,
          }),
        );
      } catch (err) {
        console.error("Failed to send read receipt", err);
      }
    }
    setTimeout(() => scrollToBottom(), 50);
  }

  function sendMessage() {
    if (!selected || !input.trim()) return;
    const clientId = `local-${Date.now()}`;
    const now = new Date().toISOString();
    const optimistic: Message = {
      id: clientId,
      clientId,
      conversationId: selected.id,
      senderId: meId || "me",
      senderName: "You",
      content: input.trim(),
      createdAt: now,
      status: "sending",
    };

    setMessages((m) => [...m, optimistic]);
    setInput("");
    setTimeout(() => scrollToBottom(), 20);

    const payload = { type: "chat_message", conversationId: selected.id, content: optimistic.content, clientId };
    try {
      wsRef.current?.send(JSON.stringify(payload));
      // send typing stop
      wsRef.current?.send(JSON.stringify({ type: "typing", conversationId: selected.id, typing: false }));

      // set ack timeout
      const tid = window.setTimeout(() => {
        setMessages((ms) => ms.map((msg) => (msg.clientId === clientId ? { ...msg, status: "failed" } : msg)));
        pendingAcks.current.delete(clientId);
      }, pendingAckTimeoutMs) as unknown as number;
      pendingAcks.current.set(clientId, tid);
    } catch (err) {
      console.error(err);
      setMessages((ms) => ms.map((msg) => (msg.clientId === clientId ? { ...msg, status: "failed" } : msg)));
    }
  }

  function onInputChange(v: string) {
    setInput(v);
    if (!selected) return;
    try {
      wsRef.current?.send(
        JSON.stringify({
          type: "typing",
          conversationId: selected.id,
          typing: true,
        }),
      );
    } catch (err) {
      console.error("Failed to send typing event", err);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      try {
        wsRef.current?.send(
          JSON.stringify({
            type: "typing",
            conversationId: selected.id,
            typing: false,
          }),
        );
      } catch (err) {
        console.error("Failed to send typing stop", err);
      }
    }, 2000) as unknown as number;
  }

  function scrollToBottom() {
    try {
      const el = containerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {
      console.error("Failed to scroll", err);
    }
  }

  function retryMessage(msg: Message) {
    if (!selected) return;
    // assign new clientId and resend
    const newClientId = `local-${Date.now()}`;
    setMessages((ms) => ms.map((m) => (m.clientId === msg.clientId ? { ...m, clientId: newClientId, status: "sending", id: newClientId } : m)));
    const payload = { type: "chat_message", conversationId: selected.id, content: msg.content, clientId: newClientId };
    try {
      wsRef.current?.send(JSON.stringify(payload));
      const tid = window.setTimeout(() => {
        setMessages((ms) => ms.map((m) => (m.clientId === newClientId ? { ...m, status: "failed" } : m)));
        pendingAcks.current.delete(newClientId);
      }, pendingAckTimeoutMs) as unknown as number;
      pendingAcks.current.set(newClientId, tid);
    } catch (err) {
      console.error(err);
      setMessages((ms) => ms.map((m) => (m.clientId === newClientId ? { ...m, status: "failed" } : m)));
    }
  }
  if (!hydrated) return null;
  if (hydrated && !getToken()) return <NotAuthenticated />;
  return (
  
  <div className="min-h-screen px-4 py-8 md:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="rounded-[28px] bg-black/30 backdrop-blur-2xl border border-white/10 shadow-[0_50px_140px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 min-h-[85vh]">

          {/* Sidebar */}
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-white/10 bg-white/5">
            <div className="p-5">
              <h3 className="text-lg font-semibold tracking-tight">Chats</h3>
              <p className="text-xs text-white/50 mt-1">
                Personal + Family conversations
              </p>
            </div>

            <div className="px-3 pb-4 space-y-2 overflow-auto max-h-[70vh]">
              {personal.map((c) => {
                const title =
                  c.participants?.map((p) => p.name || p.id).join(", ") ||
                  "Conversation";

                const isActive = selected?.id === c.id;

                return (
                  <button
                    key={c.id}
                    onClick={() => loadConversation(c)}
                    className={`
                      w-full text-left
                      px-4 py-3 rounded-2xl
                      border transition
                      ${
                        isActive
                          ? "bg-white/10 border-white/20"
                          : "bg-white/0 border-white/0 hover:bg-white/5 hover:border-white/10"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">
                          {title}
                        </div>
                        <div className="text-xs text-white/50 truncate mt-1">
                          {c.lastMessage || "No messages yet"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!!c.unreadCount && c.unreadCount > 0 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15 text-white/80">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {familyChat && (
                <button
                  key={familyChat.id}
                  onClick={() => loadConversation(familyChat)}
                  className={`
                    w-full text-left
                    px-4 py-3 rounded-2xl
                    border transition
                    ${
                      selected?.id === familyChat.id
                        ? "bg-white/10 border-white/20"
                        : "bg-white/0 border-white/0 hover:bg-white/5 hover:border-white/10"
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-white truncate">
                        Family Chat
                      </div>
                      <div className="text-xs text-white/50 truncate mt-1">
                        {familyChat.lastMessage || "No messages yet"}
                      </div>
                    </div>

                    {!!familyChat.unreadCount && familyChat.unreadCount > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15 text-white/80">
                        {familyChat.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-4 flex flex-col bg-white/3">

            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-white/5">
              {selected ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-semibold text-white">
                      {selected === familyChat
                        ? "Family Chat"
                        : selected.participants?.map((p) => p.name || p.id).join(", ")}
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      {Object.entries(typingUsers).some(([, v]) => v)
                        ? "Someone is typing..."
                        : "Online"}
                    </div>
                  </div>

                  <div className="text-xs text-white/50">
                    {messages.length} messages
                  </div>
                </div>
              ) : (
                <div className="text-white/70 font-medium">
                  Select a conversation
                </div>
              )}
            </div>

            {/* Messages */}
            <div
              ref={containerRef}
              className="flex-1 overflow-auto px-4 md:px-6 py-6 space-y-3"
            >
              {!selected ? (
                <div className="h-full flex items-center justify-center text-white/40">
                  Pick a chat from the left
                </div>
              ) : (
                messages.map((m) => {
                  const isMe =
                    m.senderId === (meId || "") ||
                    (m.clientId && m.senderName === "You");

                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`
                          max-w-[78%] md:max-w-[60%]
                          rounded-3xl px-4 py-3
                          border backdrop-blur-xl
                          shadow-[0_10px_40px_rgba(0,0,0,0.15)]
                          ${
                            isMe
                              ? "bg-white/12 border-white/20 text-white"
                              : "bg-black/20 border-white/10 text-white/90"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          {!isMe && (
                            <div className="text-xs text-white/60 font-medium">
                              {m.senderName}
                            </div>
                          )}

                          {m.clientId && (
                            <div className="text-[11px] text-white/40">
                              {m.status === "sending"
                                ? "sending…"
                                : m.status === "failed"
                                  ? "failed"
                                  : "sent"}
                            </div>
                          )}
                        </div>

                        <div className="mt-1 text-[15px] leading-relaxed">
                          {m.content}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-white/40">
                          <div>
                            {new Date(m.createdAt).toLocaleString()}
                          </div>

                          {m.clientId && m.status === "failed" && (
                            <button
                              onClick={() => retryMessage(m)}
                              className="text-red-300 hover:text-red-200 underline"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Typing indicator */}
            {selected && (
              <div className="px-6 pb-2 text-xs text-white/40">
                {Object.entries(typingUsers)
                  .filter(([, v]) => v)
                  .map(([k]) => `${k} typing...`)
                  .join(" ")}
              </div>
            )}

            {/* Input */}
            {selected && (
              <div className="p-4 md:p-6 border-t border-white/10 bg-white/5">
                <div className="flex gap-3">
                  <input
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    placeholder="Type a message..."
                    className="
                      flex-1 px-4 py-3 rounded-2xl
                      bg-black/20 border border-white/10
                      text-white/80 placeholder:text-white/35
                      focus:outline-none focus:ring-2 focus:ring-white/15
                    "
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMessage();
                    }}
                  />

                  <button
                    onClick={sendMessage}
                    className="
                      px-5 py-3 rounded-2xl
                      bg-white/12 border border-white/20
                      text-white font-semibold
                      hover:bg-white/18 transition
                      shadow-[0_15px_40px_rgba(0,0,0,0.25)]
                    "
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  </div>
);

}
