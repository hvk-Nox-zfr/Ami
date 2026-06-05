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
  const [incomingCall, setIncomingCall] = useState<string | null>(null);
  const [callUser, setCallUser] = useState<{ id: string; role: "caller" | "callee" } | null>(null);

  const [search, setSearch] = useState("");

  const loadFriends = useCallback(async () => {
    const res = await fetch("/api/friends/list");
    const data = await res.json();
    setAmis(data.friends || []);
  }, []);

  useEffect(() => {
    if (!username) return;

    const s = io("https://ami-msec.onrender.com", { transports: ["websocket"] });
    setSocket(s);

    s.emit("setup", username);
    s.emit("user-online", username);

    loadFriends();

    s.on("update-status", ({ username: u, online }) => {
      setAmis((prev) => prev.map((f) => (f.username === u ? { ...f, online } : f)));
    });

    s.on("incoming-call", ({ from }) => {
      setIncomingCall(from);
    });

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
  }, [username, loadFriends]);

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
    <main className="h-screen w-full bg-black text-white flex">

  {/* --- SIDEBAR (PC ONLY) --- */}
  <aside className="hidden md:flex flex-col w-20 bg-[#0a0a0a] border-r border-gray-800 p-4 gap-8 items-center">

    <button className="nav-btn">
      <svg width="26" height="26" fill="white"><path d="M3 12l9-9 9 9v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-9z"/></svg>
    </button>

    <button className="nav-btn">
      <svg width="26" height="26" fill="white"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-8 2-8 5v2h16v-2c0-3-4-5-8-5z"/></svg>
    </button>

    <button className="nav-btn">
      <svg width="26" height="26" fill="white"><path d="M4 4h20v4H4zm0 8h20v4H4zm0 8h20v4H4z"/></svg>
    </button>

    <button className="nav-btn">
      <svg width="26" height="26" fill="white"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z"/></svg>
    </button>

  </aside>

  {/* --- LISTE D’AMIS (FULL SCREEN ON MOBILE) --- */}
  <section className="w-full md:w-80 bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto">
    <h2 className="text-xl font-bold mb-4 text-yellow-300">Amis</h2>

    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Rechercher..."
      className="w-full p-3 mb-4 bg-gray-800 rounded-xl text-lg md:text-base"
    />

    <div className="space-y-3">
      {amis
        .filter((f) => f.username.toLowerCase().includes(search.toLowerCase()))
        .map((friend) => (
          <div key={friend._id} className="friend-card">

            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={friend.avatar || "/default-avatar.png"}
                  className="w-14 h-14 md:w-12 md:h-12 rounded-full object-cover"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                    friend.online ? "bg-green-500" : "bg-gray-500"
                  }`}
                ></span>
              </div>

              <div>
                <p className="font-semibold text-lg md:text-base">{friend.username}</p>
                <p className="text-sm text-gray-400">
                  {friend.online ? "En ligne" : "Hors ligne"}
                </p>
              </div>
            </div>

            <button onClick={() => startCall(friend.username)} className="call-btn">
              <svg width="22" height="22" fill="white">
                <path d="M6 2l4 2-2 4c1 2 3 4 5 5l4-2 2 4c-1 1-3 2-5 2-6 0-12-6-12-12 0-2 1-4 2-5z"/>
              </svg>
            </button>

          </div>
        ))}
    </div>
  </section>

  {/* --- ZONE PRINCIPALE (PC ONLY) --- */}
  <section className="hidden md:flex flex-1 bg-gray-950 items-center justify-center text-gray-500">
    <p>Sélectionne un ami pour discuter ou appeler</p>
  </section>

  {/* --- ÉCRAN D’APPEL --- */}
  {callUser && (
    <Call
      selfId={username}
      peerId={callUser.id}
      isCaller={callUser.role === "caller"}
      onClose={() => setCallUser(null)}
    />
  )}

  {/* --- POPUP D’APPEL ENTRANT (RESPONSIVE) --- */}
  {incomingCall && (
    <div className="incoming-call-popup">
      <p className="font-semibold text-lg">{incomingCall} t’appelle 📞</p>

      <div className="flex gap-4 mt-4">
        <button onClick={acceptCall} className="popup-btn accept">Accepter</button>
        <button onClick={rejectCall} className="popup-btn decline">Refuser</button>
      </div>
    </div>
  )}
</main>

  );
}
