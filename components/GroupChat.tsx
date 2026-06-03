"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { clientPusher } from "@/lib/pusher";

interface GroupChatProps {
  groupId: string;
}

export default function GroupChat({ groupId }: GroupChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Charger les messages du groupe
  const loadMessages = async () => {
    const res = await fetch("/api/groups/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });

    const data = await res.json();
    setMessages(data.messages || []);
  };

  useEffect(() => {
    if (groupId) loadMessages();
  }, [groupId]);

  // Scroll auto
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Temps réel Pusher
  useEffect(() => {
    // IMPORTANT : empêcher l’erreur TypeScript
    if (!clientPusher) return;

    const channel = clientPusher.subscribe(`group-${groupId}`);

    const handler = (data: any) => {
      setMessages((prev) => [...prev, data]);
    };

    channel.bind("new-group-message", handler);

    return () => {
      channel.unbind("new-group-message", handler);
      clientPusher.unsubscribe(`group-${groupId}`);
    };
  }, [groupId]);

  // Envoyer un message
  const sendMessage = async () => {
    if (!content.trim()) return;

    await fetch("/api/groups/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId,
        content,
      }),
    });

    setContent("");
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((msg, i) => {
          const isMe = msg.sender === session?.user?.email;

          const username = isMe
            ? "Moi"
            : msg.senderUsername || msg.sender;

          return (
            <div
              key={i}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <span className="text-xs text-gray-400 mb-1">
                {username}
              </span>

              <div
                className={`p-2 rounded-lg max-w-[70%] ${
                  isMe
                    ? "bg-blue-500 text-white self-end"
                    : "bg-gray-300 text-black self-start"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
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
