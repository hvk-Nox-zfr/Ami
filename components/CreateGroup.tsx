"use client";

import { useState } from "react";

export default function CreateGroup({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [members, setMembers] = useState(""); // pseudos séparés par virgule
  const [error, setError] = useState("");

  const create = async () => {
    setError("");

    const usernames = members
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    const res = await fetch("/api/groups/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        members: usernames,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }

    setName("");
    setMembers("");
    onCreated(); // recharge la liste
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <h2 className="text-lg font-bold">Créer un groupe</h2>

      <input
        className="w-full border p-2 rounded"
        placeholder="Nom du groupe"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="w-full border p-2 rounded"
        placeholder="Pseudos des membres (séparés par des virgules)"
        value={members}
        onChange={(e) => setMembers(e.target.value)}
      />

      {error && <p className="text-red-500">{error}</p>}

      <button
        onClick={create}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Créer
      </button>
    </div>
  );
}
