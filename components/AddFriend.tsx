"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function AddFriend() {
  const [username, setUsername] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const { data: session } = useSession();

  const search = async (value: string) => {
    setUsername(value);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    const res = await fetch("/api/users/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: value }),
    });

    const data = await res.json();
    setResults(data.users || []);
  };

  const addFriend = async (friendName: string) => {
    if (!session?.user?.name) return;

    await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: session.user.name,
        to: friendName,
      }),
    });

    setUsername("");
    setResults([]);
    window.location.reload();
  };

  return (
    <div className="mt-6 space-y-2">
      <input
        value={username}
        onChange={(e) => search(e.target.value)}
        placeholder="Pseudo de l'ami"
        className="w-full p-2 bg-gray-800 rounded-xl"
      />

      {/* Résultats */}
      {results.length > 0 && (
        <div className="bg-gray-900 p-2 rounded-xl space-y-1">
          {results.map((u) => (
            <div
              key={u.email}
              onClick={() => addFriend(u.name)}
              className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
            >
              {u.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
