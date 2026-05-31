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

      {/* ⭐ Boutons futuristes */}
      <div className="absolute bottom-10 flex gap-6 bg-black/40 px-6 py-4 rounded-full backdrop-blur-md shadow-xl">

        {/* Micro */}
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

        {/* Caméra */}
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

        {/* Switch caméra (mobile only) */}
        {isMobile && (
          <button onClick={switchCamera} className="neon-btn">
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2">
              <path d="M4 4h4l2-2h4l2 2h4v4l2 2v4l-2 2v4h-4l-2 2h-4l-2-2H4v-4l-2-2v-4l2-2z" />
              <path d="M9 9l6 6" />
              <path d="M15 9l-6 6" />
            </svg>
          </button>
        )}
      </div>

      <p className="absolute bottom-5 text-gray-300 text-lg">
        {connected ? "Connecté ✔" : "Connexion…"}
      </p>
    </div>
  );
}
