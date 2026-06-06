"use client";

import { useEffect, useState } from "react";

type ChatProps = {
  user: string;
  self: string;
  socket: any;
};

export default function Chat({ user, self, socket }: ChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!socket) return;

    // ❗ Empêche les crashs Safari / URLs invalides
    if (!user || typeof user !== "string" || user.trim() === "") return;

    const safeUser = encodeURIComponent(user);

    // Charger les messages existants
    fetch(`/api/messages/${safeUser}`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => {});

    // Listener propre
    const handler = (msg: any) => {
      if (msg.from === user || msg.to === user) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("new-message", handler);

    return () => {
      socket.off("new-message", handler);
    };
  }, [socket, user]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const msg = {
      from: self,
      to: user,
      text: input,
      time: Date.now(),
    };

    socket.emit("send-message", msg);
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a]">

      {/* HEADER */}
      <div className="p-4 border-b border-gray-800 bg-black/40 backdrop-blur-md">
        <h2 className="text-xl font-bold">{user}</h2>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[70%] p-3 rounded-xl ${
              m.from === self
                ? "ml-auto bg-green-600 text-white"
                : "mr-auto bg-gray-800 text-gray-200"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="p-4 flex gap-3 border-t border-gray-800 bg-black/40 backdrop-blur-md">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 p-3 bg-gray-800 rounded-xl"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-green-600 rounded-xl hover:bg-green-700 transition"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
