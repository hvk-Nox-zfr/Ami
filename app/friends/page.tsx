"use client";

import { useState } from "react";

export default function FriendsPage() {
  const [tab, setTab] = useState<"add" | "requests">("add");
  const [search, setSearch] = useState("");

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
        {tab === "add" && (
          <div>
            <p className="text-gray-400 mb-4">Rechercher un utilisateur :</p>

            {search.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                  <div>
                    <p className="font-semibold">ExempleUser</p>
                    <p className="text-gray-400 text-sm">ID : 12345</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 rounded-full text-sm">
                    Ajouter
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Tape un nom pour commencer</p>
            )}
          </div>
        )}

        {tab === "requests" && (
          <div>
            <p className="text-gray-400 mb-4">Demandes d’amis :</p>

            <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl mb-2">
              <div>
                <p className="font-semibold">UserDemande</p>
                <p className="text-gray-400 text-sm">ID : 98765</p>
              </div>

              <div className="flex gap-2">
                <button className="px-3 py-2 bg-green-600 rounded-full text-sm">
                  Accepter
                </button>
                <button className="px-3 py-2 bg-red-600 rounded-full text-sm">
                  Refuser
                </button>
              </div>
            </div>
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
