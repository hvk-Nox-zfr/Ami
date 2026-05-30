"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";

import Chat from "@/components/Chat";
import GroupChat from "@/components/GroupChat";
import CreateGroup from "@/components/CreateGroup";
import Call from "@/components/Call";
import AddFriend from "@/components/AddFriend";

export default function HomeClient() {
  const { data: session } = useSession();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // ⭐ Nouveau : callUser contient id + role
  const [callUser, setCallUser] = useState<{
    id: string;
    role: "caller" | "callee";
  } | null>(null);

  const [incomingCall, setIncomingCall] = useState<string | null>(null);

  const [amis, setAmis] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    if (!session?.user?.name) return;

    const s = io("https://ami-msec.onrender.com");
    setSocket(s);

    // ⭐ Rejoindre la room utilisateur
    s.emit("setup", session.user.name);

    // Charger les amis
    const loadFriends = async () => {
      const res = await fetch("/api/friends/list");
      const data = await res.json();
      setAmis(data.friends || []);
    };
    loadFriends();

    // Statut en ligne
    s.emit("user-online", session.user.name);

    s.on("update-status", ({ username, online }) => {
      setAmis((prev) =>
        prev.map((f) =>
          f.username === username ? { ...f, online } : f
        )
      );
    });

    // ⭐ Réception d’un appel entrant
    s.on("incoming-call", ({ from }) => {
      setIncomingCall(from);
    });

    // ⭐ L’autre accepte → on ouvre l’écran d’appel
    s.on("call-accepted", ({ from }) => {
      setIncomingCall(null);
      setCallUser({ id: from, role: "callee" });
    });

    // ⭐ L’autre refuse
    s.on("call-declined", ({ from }) => {
      alert(`${from} a refusé l’appel`);
      setCallUser(null);
    });

    return () => {
      s.emit("user-offline", session.user.name);
      s.disconnect();
    };
  }, [session]);

  // Charger groupes
  const loadGroups = async () => {
    const res = await fetch("/api/groups/list");
    const data = await res.json();
    setGroups(data.groups || []);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // ⭐ Lancer un appel
  const startCall = (friend: string) => {
    if (!socket || !session?.user?.name) return;

    socket.emit("call-user", {
      from: session.user.name,
      to: friend,
    });

    // ⭐ Caller
    setCallUser({ id: friend, role: "caller" });
  };

  // ⭐ Accepter l’appel
  const acceptCall = () => {
    if (!socket || !incomingCall || !session?.user?.name) return;

    socket.emit("call-accepted", {
      from: session.user.name,
      to: incomingCall,
    });

    setCallUser({ id: incomingCall, role: "callee" });
    setIncomingCall(null);
  };

  // ⭐ Refuser l’appel
  const rejectCall = () => {
    if (!socket || !incomingCall || !session?.user?.name) return;

    socket.emit("call-declined", {
      from: session.user.name,
      to: incomingCall,
    });

    setIncomingCall(null);
  };

  return (
    <main className="h-screen w-full bg-black text-white flex flex-col md:flex-row">

      {/* ⭐ Fenêtre d'appel */}
      {callUser && (
        <Call
          roomId={callUser.id}
          role={callUser.role}
          onClose={() => setCallUser(null)}
        />
      )}

      {/* ⭐ Popup d’appel entrant */}
      {incomingCall && (
        <div className="fixed bottom-5 right-5 bg-gray-900 p-4 rounded-xl shadow-xl z-50">
          <p className="font-semibold">{incomingCall} t’appelle 📞</p>

          <div className="flex gap-3 mt-3">
            <button
              onClick={acceptCall}
              className="bg-green-600 px-3 py-1 rounded-lg hover:bg-green-700"
            >
              Accepter
            </button>

            <button
              onClick={rejectCall}
              className="bg-red-600 px-3 py-1 rounded-lg hover:bg-red-700"
            >
              Refuser
            </button>
          </div>
        </div>
      )}

      {/* ⭐ Colonne gauche (amis) */}
      <aside className="w-full md:w-1/4 border-r border-gray-800 p-5 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-yellow-300">Chats</h2>

        <div className="space-y-3">
          {amis.map((friend) => (
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

              {/* Bouton d'appel */}
              <button
                onClick={() => startCall(friend.username)}
                className="bg-green-600 px-3 py-1 rounded-lg hover:bg-green-700"
              >
                📞
              </button>
            </div>
          ))}
        </div>

        <AddFriend />

        <button
          onClick={() => setShowCreateGroup(!showCreateGroup)}
          className="mt-4 w-full bg-green-600 p-2 rounded-xl hover:bg-green-700"
        >
          + Créer un groupe
        </button>

        {showCreateGroup && (
          <div className="mt-4">
            <CreateGroup
              onCreated={() => {
                setShowCreateGroup(false);
                loadGroups();
              }}
            />
          </div>
        )}

        <h2 className="text-xl font-bold mt-6 mb-2 text-yellow-300">
          Groupes
        </h2>

        <div className="space-y-3">
          {groups.map((g) => (
            <div
              key={g._id}
              onClick={() => {
                setSelectedUser(null);
                setSelectedGroup(g._id);
              }}
              className="p-3 bg-gray-900 rounded-xl hover:bg-gray-800 cursor-pointer"
            >
              {g.name}
            </div>
          ))}
        </div>
      </aside>

      {/* ⭐ Centre */}
      <section className="flex-1 p-4 md:p-8 overflow-y-auto">
        {!selectedUser && !selectedGroup && (
          <p className="text-gray-400 text-center mt-20">
            Sélectionne un ami ou un groupe pour discuter
          </p>
        )}

        {selectedUser && (
          <Chat
            otherUser={selectedUser}
            onCall={(friend) => startCall(friend)}
          />
        )}

        {selectedGroup && <GroupChat groupId={selectedGroup} />}
      </section>

      {/* ⭐ Profil */}
      <aside className="hidden md:block w-1/4 border-l border-gray-800 p-5">
        <h2 className="text-xl font-bold mb-4 text-yellow-300">Profil</h2>

        <div className="bg-gray-900 p-5 rounded-2xl flex flex-col items-center">
          <img
            src={session?.user?.avatar || "/default-avatar.png"}
            className="w-20 h-20 rounded-full object-cover mb-4"
          />

          <p className="text-lg font-semibold">{session?.user?.name}</p>
          <p className="text-gray-400 text-sm">{session?.user?.email}</p>

          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/api/auth/signout";
            }}
            className="mt-4 w-full p-2 bg-red-600 rounded-xl hover:bg-red-700"
          >
            Se déconnecter
          </button>
        </div>
      </aside>
    </main>
  );
}
