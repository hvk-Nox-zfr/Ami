"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function AddFriend() {
  const [username, setUsername] = useState("");
  const { data: session } = useSession();

  const addFriend = async () => {
    if (!username.trim()) return;
    if (!session?.user?.name) return;

    await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: session.user.name, // celui qui envoie
        to: username,            // celui qu'on ajoute
      }),
    });

    setUsername("");
    window.location.reload();
  };

  return (
    <div className="mt-6">
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Pseudo de l'ami"
        className="w-full p-2 bg-gray-800 rounded-xl"
      />
      <button
        onClick={addFriend}
        className="mt-2 w-full bg-yellow-300 text-black p-2 rounded-xl hover:bg-yellow-400"
      >
        Ajouter un ami
      </button>
    </div>
  );
}
