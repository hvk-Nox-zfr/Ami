"use client";

import { useState } from "react";

export default function AddFriend() {
  const [username, setUsername] = useState("");

  const addFriend = async () => {
    if (!username.trim()) return;

    await fetch("/api/friends/add", {
      method: "POST",
      body: JSON.stringify({ friendUsername: username }),
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
