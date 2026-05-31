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
  const localStream = useRef<MediaStream | null>(null);

  const isCaller = role === "caller";
  const [connected, setConnected] = useState(false);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [usingFrontCam, setUsingFrontCam] = useState(true);

  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  // ⭐ Raccrocher proprement
  const hangUp = async () => {
    localStream.current?.getTracks().forEach((t) => t.stop());
    pc.current?.close();

    await fetch("/api/call/signal", {
      method: "POST",
      body: JSON.stringify({
        roomId,
        data: { hangup: true },
      }),
    });

    onClose();
  };

  // ⭐ Mute / Unmute micro
  const toggleMic = () => {
    const audioTrack = localStream.current?.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  };

  // ⭐ Couper / rallumer caméra
  const toggleCam = () => {
    const videoTrack = localStream.current?.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setCamOn(videoTrack.enabled);
  };

  // ⭐ Switch caméra avant / arrière (MOBILE)
  const switchCamera = async () => {
    if (!isMobile) return;

    const newFacing = usingFrontCam ? "environment" : "user";
    setUsingFrontCam(!usingFrontCam);

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: newFacing },
      audio: true,
    });

    // Remplacer la vidéo locale
    if (localVideo.current) {
      localVideo.current.srcObject = newStream;
    }

    // Remplacer la track dans WebRTC
    const videoSender = pc.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");

    if (videoSender) {
      videoSender.replaceTrack(newStream.getVideoTracks()[0]);
    }

    // Mettre à jour le stream local
    localStream.current = newStream;
  };

  useEffect(() => {
    const start = async () => {
      pc.current = new RTCPeerConnection({
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

      pc.current.ontrack = (event) => {
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = event.streams[0];
        }
      };

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

      // ⭐ Caméra + micro
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });

      if (localVideo.current) {
        localVideo.current.srcObject = localStream.current;
      }

      localStream.current.getTracks().forEach((track) => {
        pc.current?.addTrack(track, localStream.current!);
      });

      // ⭐ Caller → créer l’offre
      if (isCaller) {
        const offer = await pc.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await pc.current.setLocalDescription(offer);

        await fetch("/api/call/signal", {
          method: "POST",
          body: JSON.stringify({
            roomId,
            data: { offer },
          }),
        });
      }

      // ⭐ Polling optimisé
      const interval = setInterval(async () => {
        const res = await fetch(`/api/call/signal?roomId=${roomId}`);
        const { data } = await res.json();

        for (const d of data) {
          if (d.hangup) {
            hangUp();
            return;
          }

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

          if (d.answer && isCaller) {
            await pc.current?.setRemoteDescription(d.answer);
            setConnected(true);
          }

          if (d.candidate) {
            try {
              await pc.current?.addIceCandidate(d.candidate);
            } catch {}
          }
        }
      }, 80);

      return () => clearInterval(interval);
    };

    start();
  }, [roomId, isCaller]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]">

      {/* ⭐ Raccrocher */}
      <button
        onClick={hangUp}
        className="absolute top-5 right-5 bg-red-600 px-5 py-2 rounded-full text-white text-lg shadow-xl hover:bg-red-700 transition"
      >
        🔴
      </button>

      {/* ⭐ PC MODE */}
      {!isMobile && (
        <div className="relative flex gap-6 items-center">

          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            className="w-[600px] h-[400px] rounded-xl border-2 border-green-400 shadow-lg object-cover"
          />

          <video
            ref={localVideo}
            autoPlay
            muted
            playsInline
            className="absolute bottom-5 right-5 w-40 h-28 rounded-xl border-2 border-yellow-400 shadow-lg object-cover"
          />
        </div>
      )}

      {/* ⭐ MOBILE MODE */}
      {isMobile && (
        <div className="relative w-full h-full flex items-center justify-center">

          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          <video
            ref={localVideo}
            autoPlay
            muted
            playsInline
            className="absolute bottom-6 right-6 w-24 h-24 rounded-full border-2 border-yellow-400 shadow-xl object-cover"
          />
        </div>
      )}

      {/* ⭐ Boutons */}
      <div className="absolute bottom-10 flex gap-6 bg-gray-900 bg-opacity-60 px-6 py-3 rounded-full shadow-xl">

        <button
          onClick={toggleMic}
          className={`px-4 py-2 rounded-full ${
            micOn ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {micOn ? "🎤" : "🔇"}
        </button>

        <button
          onClick={toggleCam}
          className={`px-4 py-2 rounded-full ${
            camOn ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {camOn ? "📷" : "🚫"}
        </button>

        {isMobile && (
          <button
            onClick={switchCamera}
            className="px-4 py-2 rounded-full bg-blue-600"
          >
            🔄
          </button>
        )}
      </div>

      <p className="absolute bottom-5 text-gray-300 text-lg">
        {connected ? "Connecté ✔" : "Connexion…"}
      </p>
    </div>
  );
}
