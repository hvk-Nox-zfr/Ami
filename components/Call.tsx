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

  // --- init socket + webrtc ---
  useEffect(() => {
    const socket = io(SIGNALING_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("setup", selfId);
    });

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
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

    const startMedia = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
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

    // recevoir offer
    socket.on("webrtc-offer", async ({ offer }) => {
      if (!pc.currentRemoteDescription && pc.signalingState !== "stable") return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { to: peerId, answer });
    });

    // recevoir answer
    socket.on("webrtc-answer", async ({ answer }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      setConnected(true);
    });

    // recevoir ICE
    socket.on("webrtc-ice-candidate", async ({ candidate }) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // ignore
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
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]">
      {/* Raccrocher */}
      <button
        onClick={hangUp}
        className="absolute top-5 right-5 bg-red-600 px-5 py-2 rounded-full text-white text-lg shadow-xl hover:bg-red-700 transition"
      >
        Raccrocher
      </button>

      {/* PC */}
      {!isMobile && (
        <div className="relative flex gap-6 items-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-[600px] h-[400px] rounded-xl border-2 border-green-400 shadow-lg object-cover bg-black"
          />
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-5 right-5 w-40 h-28 rounded-xl border-2 border-yellow-400 shadow-lg object-cover bg-black"
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
            className="absolute bottom-6 right-6 w-24 h-24 rounded-full border-2 border-yellow-400 shadow-xl object-cover bg-black"
          />
        </div>
      )}

      {/* Boutons futuristes */}
      <div className="absolute bottom-10 call-controls">
        <button
          onClick={toggleMic}
          className={`neon-btn ${micOn ? "green" : "red"}`}
        >
          {micOn ? (
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 1v14a4 4 0 0 0 4-4V5a4 4 0 0 0-8 0v6a4 4 0 0 0 4 4" />
              <path d="M19 10a7 7 0 0 1-14 0" />
              <path d="M12 21v-4" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2">
              <path d="M1 1l22 22" />
              <path d="M12 1v5m0 4v5a4 4 0 0 0 4-4V9" />
              <path d="M19 10a7 7 0 0 1-14 0" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleCam}
          className={`neon-btn ${camOn ? "green" : "red"}`}
        >
          {camOn ? (
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="5" width="13" height="14" rx="2" />
              <path d="M16 8l5-3v14l-5-3z" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2">
              <path d="M1 1l22 22" />
              <rect x="3" y="5" width="13" height="14" rx="2" />
              <path d="M16 8l5-3v14l-5-3z" />
            </svg>
          )}
        </button>
      </div>

      <p className="absolute bottom-4 text-gray-300 text-sm">
        {connected ? "Connecté ✔" : "Connexion…"}
      </p>
    </div>
  );
}
