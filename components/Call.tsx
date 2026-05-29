"use client";

import { useEffect, useRef } from "react";

export default function Call({
  roomId,
  onClose,
}: {
  roomId: string;
  onClose: () => void;
}) {
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const makingOffer = useRef(false);

  useEffect(() => {
    const start = async () => {
      // ⭐ Serveur STUN obligatoire pour Cloudflare / 4G / WiFi différents
      pc.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pc.current.ontrack = (event) => {
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = event.streams[0];
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideo.current) {
        localVideo.current.srcObject = stream;
      }

      stream.getTracks().forEach((track) => {
        pc.current?.addTrack(track, stream);
      });

      // ⭐ Envoi ICE
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

      // ⭐ Création de l’offre
      makingOffer.current = true;
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      makingOffer.current = false;

      await fetch("/api/call/signal", {
        method: "POST",
        body: JSON.stringify({
          roomId,
          data: { offer },
        }),
      });
    };

    start();

    // ⭐ Polling plus rapide (200ms)
    const interval = setInterval(async () => {
      const res = await fetch(`/api/call/signal?roomId=${roomId}`);
      const { data } = await res.json();

      for (const d of data) {
        // ⭐ Collision d’offre gérée
        if (d.offer) {
          const offerCollision =
            makingOffer.current ||
            pc.current?.signalingState !== "stable";

          if (offerCollision) {
            await pc.current?.setLocalDescription({ type: "rollback" });
          }

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

        if (d.answer) {
          await pc.current?.setRemoteDescription(d.answer);
        }

        if (d.candidate) {
          try {
            await pc.current?.addIceCandidate(d.candidate);
          } catch (e) {
            console.log("Erreur ICE", e);
          }
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [roomId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700"
      >
        Raccrocher
      </button>

      <div className="bg-gray-900 p-6 rounded-xl flex gap-4">
        <video ref={localVideo} autoPlay muted className="w-64 rounded-xl" />
        <video ref={remoteVideo} autoPlay className="w-64 rounded-xl" />
      </div>
    </div>
  );
}
