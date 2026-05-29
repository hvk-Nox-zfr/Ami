"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { clientPusher } from "@/lib/pusher";
import Call from "@/components/Call"; // 🔥 On importe le composant d'appel

export default function Chat({ otherUser }: { otherUser: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [otherUserEmail, setOtherUserEmail] = useState<string | null>(null);
  const [callActive, setCallActive] = useState(false); // 🔥 état pour l'appel
  const bottomRef = useRef<HTMLDivElement>(null);

  // Convertir pseudo → email
  const fetchEmail = async () => {
    const res = await fetch("/api/users/getEmailFromUsername", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: otherUser }),
    });

    const data = await res.json();
    setOtherUserEmail(data.email);
  };

  // Charger les messages
  const loadMessages = async (email: string) => {
    const res = await fetch("/api/messages/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUser: email }),
    });

    const data = await res.json();
    setMessages(data.messages);
  };

  // Charger email + messages
  useEffect(() => {
    fetchEmail();
  }, [otherUser]);

  useEffect(() => {
    if (otherUserEmail) loadMessages(otherUserEmail);
  }, [otherUserEmail]);

  // Scroll auto
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Temps réel Pusher
  useEffect(() => {
    const channel = clientPusher.subscribe("chat");

    const handler = (data: any) => {
      if (!otherUserEmail) return;

      const isBetweenUs =
        (data.sender === session?.user?.email && data.receiver === otherUserEmail) ||
        (data.sender === otherUserEmail && data.receiver === session?.user?.email);

      if (isBetweenUs) {
        setMessages((prev) => [...prev, data]);
      }
    };

    channel.bind("new-message", handler);

    return () => {
      channel.unbind("new-message", handler);
      clientPusher.unsubscribe("chat");
    };
  }, [otherUserEmail, session?.user?.email]);

  // Envoyer un message
  const sendMessage = async () => {
    if (!content.trim()) return;

    await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiver: otherUser,
        content,
      }),
    });

    setContent("");
  };

  return (
    <div className="flex flex-col h-full p-4">

      {/* 🔥 Bouton d'appel */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setCallActive(true)}
          className="bg-green-600 px-3 py-1 rounded-lg hover:bg-green-700"
        >
          📞 Appeler {otherUser}
        </button>
      </div>

      {/* Fenêtre d'appel */}
      {callActive && (
        <Call roomId={otherUser} onClose={() => setCallActive(false)} />
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((msg, i) => {
          const isMe = msg.sender === session?.user?.email;

          return (
            <div
              key={i}
              className={`p-2 rounded-lg max-w-[70%] ${
                isMe
                  ? "bg-blue-500 text-white self-end ml-auto"
                  : "bg-gray-300 text-black self-start"
              }`}
            >
              {msg.content}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-4">
        <input
          className="flex-1 border p-2 rounded-lg"
          placeholder="Écris un message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded-lg"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
