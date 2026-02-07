"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
    const unread = js.data.filter((m: Message) => !(m.readBy || []).includes(getToken() || ""));
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
      senderId: getToken() || "me",
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

  return (
    <div className="min-h-screen p-6 bg-black text-white">
      <div className="max-w-6xl mx-auto grid grid-cols-4 gap-6">
        <div className="col-span-1 bg-[#0e1320]/70 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Conversations</h3>
          <div>
            {personal.map((c) => (
              <div
                key={c.id}
                className={`p-2 rounded hover:bg-white/5 cursor-pointer ${selected?.id === c.id ? "bg-white/5" : ""}`}
                onClick={() => loadConversation(c)}
              >
                <div className="flex justify-between">
                  <div>{c.participants.map((p) => p.name || p.id).join(", ")}</div>
                  <div className="text-xs text-gray-400">{c.unreadCount || 0}</div>
                </div>
              </div>
            ))}

            {familyChat && (
              <div
                key={familyChat.id}
                className={`mt-4 p-2 rounded hover:bg-white/5 cursor-pointer ${selected?.id === familyChat.id ? "bg-white/5" : ""}`}
                onClick={() => loadConversation(familyChat)}
              >
                <div className="flex justify-between">
                  <div>Family Chat</div>
                  <div className="text-xs text-gray-400">{familyChat.unreadCount || 0}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3 bg-[#0e1320]/70 rounded-lg p-4 flex flex-col">
          {selected ? (
            <>
              <div ref={containerRef} className="flex-1 overflow-auto mb-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`p-2 rounded max-w-[70%] ${m.senderId === (getToken() || "") || m.clientId ? "bg-blue-600/20 self-end" : "bg-white/5 self-start"}`}>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-300 font-medium">{m.senderName}</div>
                      {m.clientId && (
                        <div className="text-xs text-gray-400">{m.status === "sending" ? "• sending" : m.status === "failed" ? "• failed" : "• sent"}</div>
                      )}
                    </div>
                    <div className="mt-1">{m.content}</div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <div>{new Date(m.createdAt).toLocaleString()}</div>
                      {m.clientId && m.status === "failed" && (
                        <button onClick={() => retryMessage(m)} className="text-xs text-red-400">Retry</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-2 text-xs text-gray-400">
                {Object.entries(typingUsers)
                  .filter(([, v]) => v)
                  .map(([k]) => `${k} is typing...`)
                  .join(" ")}
              </div>

              <div className="flex gap-2">
                <input value={input} onChange={(e) => onInputChange(e.target.value)} className="flex-1 px-3 py-2 rounded bg-black/50" />
                <button onClick={sendMessage} className="px-4 py-2 bg-blue-600 rounded">Send</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}
