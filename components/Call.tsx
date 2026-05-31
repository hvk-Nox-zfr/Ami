"use client";

import { useEffect, useRef, useState } from "react";

type CallProps = {
  roomId: string;
  role: "caller" | "callee";
  onClose: () => void;
};

export default function Call({ roomId, role, onClose }: CallProps) {
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);

  const pc = useRef<RTCPeerConnection | null>(null);
  const isCaller = role === "caller";

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const start = async () => {
      pc.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      });

      // ⭐ RECEVOIR LE FLUX DISTANT
      pc.current.ontrack = (event) => {
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = event.streams[0];
        }
      };

      // ⭐ ENVOYER LES ICE CANDIDATES
      pc.current.onicecandidate = async (event) => {
        if (event.candidate) {
          await fetch("/api/call/signal", {
            method: "POST",
            body: JSON.stringify({
              roomId,
              data: { candidate: event.candidate },
            }),
          });
        }
      };

      // ⭐ RÉCUPÉRER LA CAMÉRA + MICRO
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });

      if (localVideo.current) {
        localVideo.current.srcObject = stream;
      }

      stream.getTracks().forEach((track) => {
        pc.current?.addTrack(track, stream);
      });

      // ⭐ CALLER → CRÉER L’OFFRE
      if (isCaller) {
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);

        await fetch("/api/call/signal", {
          method: "POST",
          body: JSON.stringify({
            roomId,
            data: { offer },
          }),
        });
      }

      // ⭐ POLLING SIGNALING
      const interval = setInterval(async () => {
        const res = await fetch(`/api/call/signal?roomId=${roomId}`);
        const { data } = await res.json();

        for (const d of data) {
          // ⭐ CALLEE → REÇOIT L’OFFRE
          if (d.offer && !isCaller) {
            await pc.current?.setRemoteDescription(d.offer);

            const answer = await pc.current?.createAnswer();
            await pc.current?.setLocalDescription(answer);

            await fetch("/api/call/signal", {
              method: "POST",
              body: JSON.stringify({
                roomId,
                data: { answer },
              }),
            });
          }

          // ⭐ CALLER → REÇOIT LA RÉPONSE
          if (d.answer && isCaller) {
            await pc.current?.setRemoteDescription(d.answer);
            setConnected(true);
          }

          // ⭐ ICE CANDIDATES
          if (d.candidate) {
            try {
              await pc.current?.addIceCandidate(d.candidate);
            } catch (e) {
              console.log("Erreur ICE", e);
            }
          }
        }
      }, 100); // ⭐ 100ms = beaucoup plus fiable sur mobile

      return () => clearInterval(interval);
    };

    start();
  }, [roomId, isCaller]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-[9999]">

      {/* Raccrocher */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 bg-red-600 px-5 py-2 rounded-full text-white text-lg shadow-xl hover:bg-red-700 transition"
      >
        🔴 Raccrocher
      </button>

      {/* Vidéos */}
      <div className="flex flex-col md:flex-row gap-6 items-center">

        {/* Vidéo locale */}
        <video
          ref={localVideo}
          autoPlay
          muted
          playsInline
          className="w-40 h-64 md:w-64 md:h-96 rounded-xl border-2 border-yellow-400 shadow-lg object-cover"
        />

        {/* Vidéo distante */}
        <video
          ref={remoteVideo}
          autoPlay
          playsInline
          className={`w-40 h-64 md:w-64 md:h-96 rounded-xl border-2 ${
            connected ? "border-green-400" : "border-gray-600"
          } shadow-lg object-cover`}
        />
      </div>

      <p className="mt-4 text-gray-300 text-lg">
        {connected ? "Connecté ✔" : "Connexion…"}
      </p>
    </div>
  );
}
