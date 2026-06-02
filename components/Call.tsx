"use client";

// Active les Web Components LiveKit (plus besoin de register())
import "@livekit/components-core/dist/web-components";

import { useEffect, useMemo, useState } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import "@/styles/livekit.css";

// Déclare les balises <lk-...> pour éviter les erreurs Next/TS
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "lk-video": any;
      "lk-microphone-button": any;
      "lk-camera-button": any;
    }
  }
}

type CallProps = {
  selfId: string;
  peerId: string;
  isCaller: boolean;
  onClose: () => void;
};

export default function Call({ selfId, peerId, onClose }: CallProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

  const roomName = useMemo(() => {
    const ids = [selfId, peerId].sort();
    return `room-${ids[0]}-${ids[1]}`;
  }, [selfId, peerId]);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/livekit-token?room=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(selfId)}`
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Erreur token LiveKit");
        }

        const data = await res.json();
        setToken(data.token);
      } catch (e: any) {
        setError(e.message || "Impossible de récupérer le token");
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [roomName, selfId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-[9999]">
        <p className="mb-2 text-lg">Connexion à l’appel…</p>
        <p className="text-sm text-gray-400">Préparation de la salle vidéo</p>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-[9999]">
        <p className="mb-2 text-red-400">Erreur d’appel</p>
        <p className="text-sm text-gray-400 mb-4">{error || "Impossible d’obtenir le token LiveKit"}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[9999]">
      {/* Bouton raccrocher */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[10000] bg-red-600 px-5 py-2 rounded-full text-white text-sm shadow-xl hover:bg-red-700 transition"
      >
        Raccrocher
      </button>

      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        onDisconnected={onClose}
        connect={true}
        data-lk-theme="default"
        className="w-full h-full"
      >
        <div className="w-full h-full relative bg-black">

          {/* --- PC MODE (FaceTime) --- */}
          <div className="hidden md:block w-full h-full relative">
            <lk-video
              class="absolute inset-0 w-full h-full object-cover"
              participant="remote"
              source="camera"
            ></lk-video>

            <lk-video
              class="absolute bottom-6 right-6 w-48 h-32 rounded-xl border border-white/20 shadow-xl object-cover"
              participant="local"
              source="camera"
              muted
            ></lk-video>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
              <lk-microphone-button class="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md text-white"></lk-microphone-button>
              <button
                onClick={onClose}
                className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center"
              >
                ⛔
              </button>
              <lk-camera-button class="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md text-white"></lk-camera-button>
            </div>
          </div>

          {/* --- MOBILE MODE (Snapchat) --- */}
          <div className="block md:hidden w-full h-full relative">
            <lk-video
              class="absolute inset-0 w-full h-full object-cover"
              participant="remote"
              source="camera"
            ></lk-video>

            <lk-video
              class="absolute bottom-6 right-6 w-24 h-24 rounded-full border-2 border-white shadow-xl object-cover"
              participant="local"
              source="camera"
              muted
            ></lk-video>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6">
              <lk-microphone-button class="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md text-white"></lk-microphone-button>
              <button
                onClick={onClose}
                className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center"
              >
                ⛔
              </button>
              <lk-camera-button class="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md text-white"></lk-camera-button>
            </div>
          </div>

        </div>
      </LiveKitRoom>
    </div>
  );
}
