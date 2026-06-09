"use client";

import "@/styles/livekit.css";
import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  useRoomContext,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";

type CallProps = {
  selfId: string;
  peerId: string;
  isCaller: boolean;
  onClose: () => void;
};

/* ---------------- ICONES ---------------- */

const MicOn = () => (
  <svg width="28" height="28" fill="white">
    <path d="M14 18a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v8a4 4 0 0 0 4 4zm6-4a6 6 0 0 1-12 0H6a8 8 0 0 0 16 0h-2zM12 22h4v2h-4v-2z"/>
  </svg>
);

const MicOff = () => (
  <svg width="28" height="28" fill="white">
    <path d="M19 11a5 5 0 0 1-8.9 3.1l1.5-1.5A3 3 0 0 0 17 11V6a3 3 0 0 0-6 0v1.2l-2 2V6a5 5 0 0 1 10 0v5zM4 20l14-14 1.4 1.4L5.4 21.4 4 20z"/>
  </svg>
);

const CamOn = () => (
  <svg width="28" height="28" fill="white">
    <path d="M17 10l5-3v14l-5-3v2H3V8h14v2z"/>
  </svg>
);

const CamOff = () => (
  <svg width="28" height="28" fill="white">
    <path d="M3 6h12v2l5-3v14l-5-3v2H3V6zm0 14l14-14 1.4 1.4L4.4 21.4 3 20z"/>
  </svg>
);

const Hang = () => (
  <svg width="32" height="32" fill="white">
    <path d="M4 18c4-4 8-6 12-6s8 2 12 6l-3 3c-3-3-6-4-9-4s-6 1-9 4l-3-3z"/>
  </svg>
);

/* ---------------- BOUTONS ---------------- */

function MicButton() {
  const room = useRoomContext();
  const local = room?.localParticipant;
  const enabled = local?.isMicrophoneEnabled ?? false;

  return (
    <button
      onClick={() => local?.setMicrophoneEnabled(!enabled)}
      className={`call-btn ${enabled ? "btn-on" : "btn-off"}`}
    >
      {enabled ? <MicOn /> : <MicOff />}
    </button>
  );
}

function CamButton() {
  const room = useRoomContext();
  const local = room?.localParticipant;
  const enabled = local?.isCameraEnabled ?? false;

  return (
    <button
      onClick={() => local?.setCameraEnabled(!enabled)}
      className={`call-btn ${enabled ? "btn-on" : "btn-off"}`}
    >
      {enabled ? <CamOn /> : <CamOff />}
    </button>
  );
}

/* ---------------- LAYOUT VIDÉO ---------------- */

function VideoLayout() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
  ]);

  const remote = tracks.find(t => !t.participant.isLocal);
  const local = tracks.find(t => t.participant.isLocal);

  return (
    <div className="call-video-container">

      {/* REMOTE EN PLEIN ÉCRAN */}
      <div className="remote-video">
        {remote && (
          <div className="video-wrapper">
            <ParticipantTile trackRef={remote} />
          </div>
        )}
      </div>

      {/* LOCAL EN PETIT */}
      {local && (
        <div className="local-video">
          <div className="video-wrapper">
            <ParticipantTile trackRef={local} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- COMPOSANT PRINCIPAL ---------------- */

export default function Call({ selfId, peerId, onClose }: CallProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;
  const roomName = `room-${[selfId, peerId].sort().join("-")}`;

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/livekit-token?room=${roomName}&identity=${selfId}`);
      const data = await res.json();
      setToken(data.token);
      setLoading(false);
    };
    load();
  }, [roomName, selfId]);

  if (loading || !token) {
    return (
      <div className="call-screen">
        <p className="text-lg">Connexion à l’appel…</p>
      </div>
    );
  }

  return (
    <div className="call-screen">
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect={true}
        onDisconnected={onClose}
        className="w-full h-full"
      >
        <VideoLayout />

        <div className="absolute top-10 w-full text-center text-white text-xl opacity-80">
          Appel en cours…
        </div>

        <div className="call-controls">
          <MicButton />
          <button onClick={onClose} className="call-btn hang">
            <Hang />
          </button>
          <CamButton />
        </div>
      </LiveKitRoom>
    </div>
  );
}
