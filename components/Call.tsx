"use client";

import { useEffect, useRef } from "react";

type CallProps = {
  roomId: string;
  onClose: () => void;
};

export default function Call({ roomId, onClose }: CallProps) {
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);

  const isCaller = useRef(false);

  useEffect(() => {
    const start = async () => {
      pc.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pc.current.ontrack = (event: RTCTrackEvent) => {
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

      const res = await fetch(`/api/call/signal?roomId=${roomId}`);
      const { data } = await res.json();

      if (data.length === 0) {
        isCaller.current = true;

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

      const interval = setInterval(async () => {
        const res = await fetch(`/api/call/signal?roomId=${roomId}`);
        const { data } = await res.json();

        for (const d of data) {
          if (d.offer && !isCaller.current) {
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

          if (d.answer && isCaller.current) {
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
    };

    start();
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
