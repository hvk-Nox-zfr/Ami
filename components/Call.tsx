"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SIGNALING_URL = "https://ami-msec.onrender.com";

type CallProps = {
  selfId: string;
  peerId: string;
  isCaller: boolean;
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

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    let cleaned = false;

    const socket = io(SIGNALING_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("setup", selfId);
    });

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
        {
          urls: "turn:global.turn.twilio.com:3478?transport=udp",
          username: "test",
          credential: "test",
        },
      ],
    });

    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnected(true);
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
      if (pc.connectionState === "connected") setConnected(true);
    };

    const startLocalStream = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (cleaned) return;

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    };

    const startCall = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", { to: peerId, offer });
    };

    (async () => {
      await startLocalStream();
      if (isCaller) await startCall();
    })();

    socket.on("webrtc-offer", async ({ offer }) => {
      if (isCaller) return;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { to: peerId, answer });
    });

    socket.on("webrtc-answer", async ({ answer }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("webrtc-ice-candidate", async ({ candidate }) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    });

    socket.on("hangup", () => {
      cleanup();
      onClose();
    });

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;

      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      socketRef.current?.disconnect();
    };

    return () => cleanup();
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
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
      <button
        onClick={hangUp}
        className="absolute top-4 right-4 bg-red-600 px-5 py-2 rounded-full text-white shadow-xl"
      >
        Raccrocher
      </button>

      {!isMobile && (
        <div className="relative flex gap-6 items-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-[640px] h-[420px] rounded-xl bg-black object-cover"
          />
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-6 right-6 w-40 h-28 rounded-xl border border-yellow-400 object-cover"
          />
        </div>
      )}

      {isMobile && (
        <div className="relative w-full h-full">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-6 right-6 w-24 h-24 rounded-full border border-yellow-400 object-cover"
          />
        </div>
      )}
    </div>
  );
}
