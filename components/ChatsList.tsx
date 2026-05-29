"use client";

import { useEffect, useState } from "react";
import CreateGroup from "./CreateGroup";

export default function ChatsList({ onSelectUser, onSelectGroup }: any) {
  const [friends, setFriends] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [friendUsername, setFriendUsername] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Charger les amis
  const loadFriends = async () => {
    const res = await fetch("/api/users/friends");
    const data = await res.json();
    setFriends(data.friends || []);
  };

  // Charger les groupes
  const loadGroups = async () => {
    const res = await fetch("/api/groups/list");
    const data = await res.json();
    setGroups(data.groups || []);
  };

  useEffect(() => {
    loadFriends();
    loadGroups();
  }, []);

  // Ajouter un ami
  const addFriend = async () => {
    if (!friendUsername.trim()) return;

    await fetch("/api/users/addFriend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendUsername }),
    });

    setFriendUsername("");
    loadFriends();
  };

  return (
    <div className="p-4 space-y-4 text-white">

      {/* TITRE */}
      <h2 className="text-xl font-bold">Chats</h2>

      {/* LISTE DES AMIS */}
      <div className="space-y-2">
        {friends.map((f, i) => (
          <div
            key={i}
            onClick={() => onSelectUser(f.username)}
            className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
          >
            <p className="font-bold">{f.username}</p>
            <p className="text-sm text-gray-300">Clique pour discuter</p>
          </div>
        ))}
      </div>

      {/* AJOUT D'AMI */}
      <input
        className="w-full p-2 rounded bg-gray-800"
        placeholder="Pseudo de l’ami"
        value={friendUsername}
        onChange={(e) => setFriendUsername(e.target.value)}
      />
      <button
        onClick={addFriend}
        className="bg-yellow-500 text-black p-2 rounded w-full"
      >
        Ajouter un ami
      </button>

      {/* BOUTON CREER UN GROUPE */}
      <button
        onClick={() => setShowCreateGroup(!showCreateGroup)}
        className="bg-green-500 text-white p-2 rounded w-full"
      >
        + Créer un groupe
      </button>

      {/* FORMULAIRE CREATION GROUPE */}
      {showCreateGroup && (
        <CreateGroup
          onCreated={() => {
            setShowCreateGroup(false);
            loadGroups();
          }}
        />
      )}

      {/* LISTE DES GROUPES */}
      <div className="mt-4">
        <h3 className="text-lg font-bold">Groupes</h3>

        {groups.map((g) => (
          <div
            key={g._id}
            onClick={() => onSelectGroup(g._id)}
            className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 mt-2"
          >
            {g.name}
          </div>
        ))}
      </div>
    </div>
  );
}
