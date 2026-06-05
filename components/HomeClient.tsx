"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Call = dynamic(() => import("@/components/Call"), { ssr: false });

export default function HomeClient() {
  const { data: session } = useSession();
  const username = session?.user?.username as string;

  const router = useRouter();
  const [socket, setSocket] = useState<any>(null);

  const [amis, setAmis] = useState<any[]>([]);
  const [pendingReceived, setPendingReceived] = useState<string[]>([]);
  const [pendingSent, setPendingSent] = useState<string[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const [callUser, setCallUser] = useState<{ id: string; role: "caller" | "callee" } | null>(null);
  const [incomingCall, setIncomingCall] = useState<string | null>(null);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [search, setSearch] = useState("");

  const loadFriends = useCallback(async () => {
    const res = await fetch("/api/friends/list");
    const data = await res.json();
    setAmis(data.friends || []);
    setPendingReceived(data.pendingReceived || []);
    setPendingSent(data.pendingSent || []);
  }, []);

  const loadGroups = useCallback(async () => {
    const res = await fetch("/api/groups/list");
    const data = await res.json();
    setGroups(data.groups || []);
  }, []);

  useEffect(() => {
    if (!username) return;

    const s = io("https://ami-msec.onrender.com", { transports: ["websocket"] });
    setSocket(s);

    s.emit("setup", username);
    s.emit("user-online", username);

    loadFriends();
    loadGroups();

    s.on("update-status", ({ username: u, online }) => {
      setAmis((prev) => prev.map((f) => (f.username === u ? { ...f, online } : f)));
    });

    s.on("incoming-call", ({ from }) => {
      setIncomingCall(from);
    });

    // ⭐ Correction ici
    s.on("call-accepted", ({ from }) => {
      setIncomingCall(null);
      setCallUser({ id: from, role: "caller" });
    });

    s.on("call-declined", ({ from }) => {
      alert(`${from} a refusé l’appel`);
      setCallUser(null);
    });

    return () => {
      s.emit("user-offline", username);
      s.disconnect();
    };
  }, [username, loadFriends, loadGroups]);

  const startCall = (friend: string) => {
    if (!socket || !username) return;

    socket.emit("call-user", { from: username, to: friend });
    setCallUser({ id: friend, role: "caller" });
  };

  const acceptCall = () => {
    if (!socket || !incomingCall || !username) return;

    socket.emit("call-accepted", { from: username, to: incomingCall });
    setCallUser({ id: incomingCall, role: "callee" });
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (!socket || !incomingCall || !username) return;

    socket.emit("call-declined", { from: username, to: incomingCall });
    setIncomingCall(null);
  };

  return (
    <main className="h-screen w-full bg-black text-white flex flex-col">

      {/* ÉCRAN D’APPEL */}
      {callUser && (
        <Call
          selfId={username}
          peerId={callUser.id}
          isCaller={callUser.role === "caller"}
          onClose={() => setCallUser(null)}
        />
      )}

      {/* POPUP D’APPEL ENTRANT */}
      {incomingCall && (
        <div className="fixed bottom-5 right-5 bg-gray-900 p-5 rounded-2xl shadow-2xl z-50 border border-yellow-400 animate-pulse">
          <p className="font-semibold text-lg">{incomingCall} t’appelle 📞</p>

          <div className="flex gap-4 mt-4">
            <button
              onClick={acceptCall}
              className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 transition shadow-lg shadow-green-500/30"
            >
              ✅ Accepter
            </button>

            <button
              onClick={rejectCall}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition shadow-lg shadow-red-500/30"
            >
              ❌ Refuser
            </button>
          </div>
        </div>
      )}

      {/* LISTE D’AMIS */}
      <section className="flex-1 overflow-y-auto p-4">
        <h2 className="text-2xl font-bold mb-4 text-yellow-300">Amis</h2>

        <div className="space-y-3">
          {amis
            .filter((f) => f.username.toLowerCase().includes(search.toLowerCase()))
            .map((friend) => (
              <div
                key={friend._id}
                className="flex items-center justify-between p-3 bg-gray-900 rounded-xl hover:bg-gray-800 transition"
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

                {/* BOUTON D’APPEL FUTURISTE */}
                <button
                  onClick={() => startCall(friend.username)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 transition shadow-lg shadow-green-500/40 text-black font-bold"
                >
                  📞 Appeler
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* BARRE DE RECHERCHE */}
      <div className="w-full bg-gray-900 p-3 flex items-center gap-3 border-t border-gray-800">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un ami..."
          className="flex-1 p-2 bg-gray-800 rounded-xl"
        />

        <button
          onClick={() => router.push("/friends")}
          className="bg-yellow-300 text-black p-2 rounded-xl hover:bg-yellow-400"
        >
          👥
        </button>
      </div>
    </main>
  );
}
