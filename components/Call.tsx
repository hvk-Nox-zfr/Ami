"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SIGNALING_URL = "https://ami-msec.onrender.com";

type CallProps = {
  selfId: string;      // ton id (userId utilisé dans setup)
  peerId: string;      // id de l’ami (userId)
  isCaller: boolean;   // true si c’est toi qui appelles
  onClose: () => void;
};

export default function Call({ selfId, peerId, isCaller, onClose }: CallProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    const socket = io(SIGNALING_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("setup", selfId);
    });

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: [
            "turn:openrelay.metered.ca:80",
            "turn:openrelay.metered.ca:443",
            "turn:openrelay.metered.ca:443?transport=tcp",
          ],
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", {
          to: peerId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setConnected(true);
      }
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        // on peut éventuellement fermer l’appel ici
      }
    };

    const startMedia = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { to: peerId, offer });
      }
    };

    startMedia();

    // recevoir offer (côté callee)
    socket.on("webrtc-offer", async ({ offer }) => {
      if (isCaller) return; // l’appelant ne traite pas les offers
      if (!pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { to: peerId, answer });
      }
    });

    // recevoir answer (côté caller)
    socket.on("webrtc-answer", async ({ answer }) => {
      if (!pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // recevoir ICE
    socket.on("webrtc-ice-candidate", async ({ candidate }) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // on ignore les erreurs d’ICE
      }
    });

    // recevoir hangup
    socket.on("hangup", () => {
      cleanup();
      onClose();
    });

    const cleanup = () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      socketRef.current?.disconnect();
    };

    return () => {
      cleanup();
    };
  }, [selfId, peerId, isCaller, onClose]);

  const hangUp = () => {
    socketRef.current?.emit("hangup", { to: peerId });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    socketRef.current?.disconnect();
    onClose();
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-950 to-black flex items-center justify-center z-[9999]">
      {/* Header */}
      <div className="absolute top-4 left-4 text-sm text-gray-300">
        <p className="font-semibold text-white">Appel avec {peerId}</p>
        <p className="text-xs text-gray-400">
          {connected ? "Connecté" : "Connexion en cours…"}
        </p>
      </div>

      {/* Raccrocher */}
      <button
        onClick={hangUp}
        className="absolute top-4 right-4 bg-red-600 px-5 py-2 rounded-full text-white text-sm shadow-xl hover:bg-red-700 transition flex items-center gap-2"
      >
        <span>Raccrocher</span>
      </button>

      {/* PC */}
      {!isMobile && (
        <div className="relative flex gap-6 items-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-[640px] h-[420px] rounded-2xl border border-gray-700 shadow-2xl object-cover bg-black"
          />
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-6 right-6 w-40 h-28 rounded-xl border border-yellow-400 shadow-xl object-cover bg-black"
          />
        </div>
      )}

      {/* Mobile */}
      {isMobile && (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover bg-black"
          />
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-6 right-6 w-24 h-24 rounded-full border border-yellow-400 shadow-xl object-cover bg-black"
          />
        </div>
      )}

      {/* Boutons */}
      <div className="absolute bottom-10 flex gap-4 items-center">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition ${
            micOn ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {micOn ? (
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 1v10a3 3 0 0 0 6 0V7a6 6 0 0 0-12 0v4a3 3 0 0 0 6 0" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <path d="M12 21v-4" />
            </svg>
          ) : (
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2">
              <path d="M1 1l20 20" />
              <path d="M12 1v5m0 4v3a3 3 0 0 0 5-2V9" />
              <path d="M5 10a7 7 0 0 0 9 6" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleCam}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition ${
            camOn ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {camOn ? (
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="5" width="13" height="12" rx="2" />
              <path d="M16 8l4-3v12l-4-3z" />
            </svg>
          ) : (
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2">
              <path d="M1 1l20 20" />
              <rect x="3" y="5" width="13" height="12" rx="2" />
              <path d="M16 8l4-3v12l-4-3z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
