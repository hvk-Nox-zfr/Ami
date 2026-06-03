"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { clientPusher } from "@/lib/pusher";

export default function Chat({
  otherUser,
  onCall,
}: {
  otherUser: string;
  onCall: (friend: string) => void;
}) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [otherUserEmail, setOtherUserEmail] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchEmail = async () => {
    const res = await fetch("/api/users/getEmailFromUsername", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: otherUser }),
    });

    const data = await res.json();
    setOtherUserEmail(data.email);
  };

  const loadMessages = async (email: string) => {
    const res = await fetch("/api/messages/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUser: email }),
    });

    const data = await res.json();
    setMessages(data.messages);
  };

  useEffect(() => {
    fetchEmail();
  }, [otherUser]);

  useEffect(() => {
    if (otherUserEmail) loadMessages(otherUserEmail);
  }, [otherUserEmail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 FIX Pusher + TypeScript
  useEffect(() => {
    if (!clientPusher) return; // ← OBLIGATOIRE

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
      clientPusher?.unsubscribe("chat"); // ← FIX ICI
    };
  }, [otherUserEmail, session?.user?.email]);

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
      <div className="flex justify-end mb-3">
        <button
          onClick={() => onCall(otherUser)}
          className="bg-green-600 px-3 py-1 rounded-lg hover:bg-green-700"
        >
          📞 Appeler {otherUser}
        </button>
      </div>

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
