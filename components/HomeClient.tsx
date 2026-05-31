"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";

import Chat from "@/components/Chat";
import GroupChat from "@/components/GroupChat";
import CreateGroup from "@/components/CreateGroup";
import Call from "@/components/Call";
import AddFriend from "@/components/AddFriend";

function getRoomId(a: string, b: string) {
  return [a, b].sort().join("-");
}

export default function HomeClient() {
  const { data: session } = useSession();
  const username = session?.user?.name as string;

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const [callUser, setCallUser] = useState<{ id: string; role: "caller" | "callee" } | null>(null);
  const [incomingCall, setIncomingCall] = useState<string | null>(null);

  const [amis, setAmis] = useState<any[]>([]);
  const [pendingReceived, setPendingReceived] = useState<string[]>([]);
  const [pendingSent, setPendingSent] = useState<string[]>([]);

  const [groups, setGroups] = useState<any[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [search, setSearch] = useState("");

  const [socket, setSocket] = useState<any>(null);

  // SOCKET + FRIENDS
  useEffect(() => {
    if (!username) return;

    const s = io("https://ami-msec.onrender.com");
    setSocket(s);

    s.emit("setup", username);

    const loadFriends = async () => {
      const res = await fetch("/api/friends/list");
      const data = await res.json();

      setAmis(data.friends || []);
      setPendingReceived(data.pendingReceived || []);
      setPendingSent(data.pendingSent || []);
    };
    loadFriends();

    s.emit("user-online", username);

    s.on("update-status", ({ username, online }) => {
      setAmis((prev) =>
        prev.map((f) => (f.username === username ? { ...f, online } : f))
      );
    });

    s.on("incoming-call", ({ from }) => setIncomingCall(from));

    s.on("call-accepted", ({ from }) => {
      const roomId = getRoomId(username, from);
      setIncomingCall(null);
      setCallUser({ id: roomId, role: "callee" });
    });

    s.on("call-declined", ({ from }) => {
      alert(`${from} a refusé l’appel`);
      setCallUser(null);
    });

    return () => {
      s.emit("user-offline", username);
      s.disconnect();
    };
  }, [username]);

  // GROUPS
  useEffect(() => {
    const loadGroups = async () => {
      const res = await fetch("/api/groups/list");
      const data = await res.json();
      setGroups(data.groups || []);
    };
    loadGroups();
  }, []);

  const startCall = (friend: string) => {
    if (!socket || !username) return;

    socket.emit("call-user", { from: username, to: friend });

    const roomId = getRoomId(username, friend);
    setCallUser({ id: roomId, role: "caller" });
  };

  const acceptCall = () => {
    if (!socket || !incomingCall || !username) return;

    socket.emit("call-accepted", { from: username, to: incomingCall });

    const roomId = getRoomId(username, incomingCall);
    setCallUser({ id: roomId, role: "callee" });
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (!socket || !incomingCall || !username) return;

    socket.emit("call-declined", { from: username, to: incomingCall });
    setIncomingCall(null);
  };

  const acceptFriend = async (from: string) => {
    await fetch("/api/friends/accept", {
      method: "POST",
      body: JSON.stringify({ from, to: username }),
    });
    window.location.reload();
  };

  const declineFriend = async (from: string) => {
    await fetch("/api/friends/decline", {
      method: "POST",
      body: JSON.stringify({ from, to: username }),
    });
    window.location.reload();
  };

  return (
    <main className="h-screen w-full bg-black text-white flex flex-col">

      {/* APPEL */}
      {callUser && (
        <Call roomId={callUser.id} role={callUser.role} onClose={() => setCallUser(null)} />
      )}

      {incomingCall && (
        <div className="fixed bottom-5 right-5 bg-gray-900 p-4 rounded-xl shadow-xl z-50">
          <p className="font-semibold">{incomingCall} t’appelle 📞</p>
          <div className="flex gap-3 mt-3">
            <button onClick={acceptCall} className="bg-green-600 px-3 py-1 rounded-lg">Accepter</button>
            <button onClick={rejectCall} className="bg-red-600 px-3 py-1 rounded-lg">Refuser</button>
          </div>
        </div>
      )}

      {/* PAGE PRINCIPALE (LISTE D'AMIS) */}
      <section className="flex-1 overflow-y-auto p-4">
        <h2 className="text-2xl font-bold mb-4 text-yellow-300">Amis</h2>

        <div className="space-y-3">
          {amis
            .filter((f) => f.username.toLowerCase().includes(search.toLowerCase()))
            .map((friend) => (
              <div
                key={friend._id}
                className="flex items-center justify-between p-3 bg-gray-900 rounded-xl hover:bg-gray-800"
              >
                <div
                  onClick={() => {
                    setSelectedGroup(null);
                    setSelectedUser(friend.username);
                  }}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={friend.avatar || "/default-avatar.png"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                        friend.online ? "bg-green-500" : "bg-gray-500"
                      }`}
                    ></span>
                  </div>

                  <div>
                    <p className="font-semibold">{friend.username}</p>
                    <p className="text-sm text-gray-400">
                      {friend.online ? "En ligne" : "Hors ligne"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => startCall(friend.username)}
                  className="bg-green-600 px-3 py-1 rounded-lg hover:bg-green-700"
                >
                  📞
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* BARRE DU BAS (SNAPCHAT STYLE) */}
      <div className="w-full bg-gray-900 p-3 flex items-center gap-3 border-t border-gray-800">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un ami..."
          className="flex-1 p-2 bg-gray-800 rounded-xl"
        />

        <button
          onClick={() => setShowFriendRequests(true)}
          className="bg-yellow-300 text-black p-2 rounded-xl hover:bg-yellow-400"
        >
          👥
        </button>
      </div>

      {/* DRAWER DEMANDES D'AMIS */}
      {showFriendRequests && (
        <div className="fixed bottom-0 left-0 w-full bg-gray-950 p-6 rounded-t-3xl shadow-2xl border-t border-yellow-400 z-50 animate-slide-up">
          <h2 className="text-xl font-bold mb-4 text-yellow-300">Demandes d’amis</h2>

          {/* Reçues */}
          <h3 className="text-lg font-semibold mb-2">Reçues</h3>
          {pendingReceived.length === 0 && <p className="text-gray-400">Aucune demande</p>}
          {pendingReceived.map((user) => (
            <div key={user} className="flex justify-between items-center bg-gray-900 p-3 rounded-xl mb-2">
              <p>{user}</p>
              <div className="flex gap-2">
                <button onClick={() => acceptFriend(user)} className="bg-green-600 px-3 py-1 rounded-lg">Accepter</button>
                <button onClick={() => declineFriend(user)} className="bg-red-600 px-3 py-1 rounded-lg">Refuser</button>
              </div>
            </div>
          ))}

          {/* Envoyées */}
          <h3 className="text-lg font-semibold mt-4 mb-2">Envoyées</h3>
          {pendingSent.length === 0 && <p className="text-gray-400">Aucune demande envoyée</p>}
          {pendingSent.map((user) => (
            <div key={user} className="bg-gray-900 p-3 rounded-xl mb-2">
              <p>{user} — <span className="text-yellow-300">En attente…</span></p>
            </div>
          ))}

          <button
            onClick={() => setShowFriendRequests(false)}
            className="mt-4 w-full bg-yellow-300 text-black p-2 rounded-xl"
          >
            Fermer
          </button>
        </div>
      )}
    </main>
  );
}
