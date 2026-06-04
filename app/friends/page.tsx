"use client";

import { useState, useEffect } from "react";

export default function FriendsPage() {
  const [tab, setTab] = useState<"add" | "requests">("add");
  const [search, setSearch] = useState("");
  const [pendingReceived, setPendingReceived] = useState<string[]>([]);
  const [pendingSent, setPendingSent] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);

  // Charger les demandes d'amis
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/friends/list");
      const data = await res.json();
      setPendingReceived(data.pendingReceived || []);
      setPendingSent(data.pendingSent || []);
    };
    load();
  }, []);

  // Recherche d'utilisateur
  useEffect(() => {
    const searchUser = async () => {
      if (search.trim().length === 0) {
        setResults([]);
        return;
      }

      const res = await fetch("app/api/users/search?query=" + search);
      const data = await res.json();
      setResults(data.results || []);
    };

    searchUser();
  }, [search]);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">

      {/* HEADER */}
      <div className="flex justify-between items-center px-4 py-4 border-b border-white/10">
        <h1 className="text-xl font-semibold">Amis</h1>
      </div>

      {/* TABS */}
      <div className="flex w-full">
        <button
          onClick={() => setTab("add")}
          className={`flex-1 py-3 text-center ${
            tab === "add" ? "border-b-2 border-white font-semibold" : "text-gray-400"
          }`}
        >
          Ajouter un ami
        </button>

        <button
          onClick={() => setTab("requests")}
          className={`flex-1 py-3 text-center ${
            tab === "requests" ? "border-b-2 border-white font-semibold" : "text-gray-400"
          }`}
        >
          Demandes reçues
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* TAB : ADD FRIEND */}
        {tab === "add" && (
          <div>
            <p className="text-gray-400 mb-4">Rechercher un utilisateur :</p>

            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((user) => (
                  <div
                    key={user.username}
                    className="flex items-center justify-between bg-white/5 p-3 rounded-xl"
                  >
                    <div>
                      <p className="font-semibold">{user.username}</p>
                    </div>

                    <button
                      onClick={async () => {
                        await fetch("/api/friends/add", {
                          method: "POST",
                          body: JSON.stringify({ to: user.username }),
                        });
                        alert("Demande envoyée !");
                      }}
                      className="px-4 py-2 bg-blue-600 rounded-full text-sm"
                    >
                      Ajouter
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Tape un nom pour commencer</p>
            )}
          </div>
        )}

        {/* TAB : REQUESTS */}
        {tab === "requests" && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Reçues</h3>

            {pendingReceived.length === 0 && (
              <p className="text-gray-400">Aucune demande</p>
            )}

            {pendingReceived.map((user) => (
              <div
                key={user}
                className="flex justify-between items-center bg-white/5 p-3 rounded-xl mb-2"
              >
                <p>{user}</p>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await fetch("/api/friends/accept", {
                        method: "POST",
                        body: JSON.stringify({ from: user }),
                      });
                      setPendingReceived((prev) =>
                        prev.filter((u) => u !== user)
                      );
                    }}
                    className="px-3 py-2 bg-green-600 rounded-full text-sm"
                  >
                    Accepter
                  </button>

                  <button
                    onClick={async () => {
                      await fetch("/api/friends/decline", {
                        method: "POST",
                        body: JSON.stringify({ from: user }),
                      });
                      setPendingReceived((prev) =>
                        prev.filter((u) => u !== user)
                      );
                    }}
                    className="px-3 py-2 bg-red-600 rounded-full text-sm"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}

            <h3 className="text-lg font-semibold mt-4 mb-2">Envoyées</h3>

            {pendingSent.length === 0 && (
              <p className="text-gray-400">Aucune demande envoyée</p>
            )}

            {pendingSent.map((user) => (
              <div key={user} className="bg-white/5 p-3 rounded-xl mb-2">
                <p>{user} — <span className="text-yellow-300">En attente…</span></p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEARCH BAR */}
      <div className="p-4 border-t border-white/10">
        <input
          type="text"
          placeholder="Rechercher un utilisateur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-full bg-white/10 text-white placeholder-gray-400 outline-none"
        />
      </div>
    </div>
  );
}
