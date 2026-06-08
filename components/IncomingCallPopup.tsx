"use client";

import { useEffect, useState } from "react";

// ⭐ On déclare les types ici
type IncomingCallPopupProps = {
  caller: string;
  onAccept: () => void;
  onDecline: () => void;
};

export default function IncomingCallPopup({
  caller,
  onAccept,
  onDecline,
}: IncomingCallPopupProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // On déclenche l’animation juste après le montage
    const timer = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`call-island ${show ? "show" : ""}`}>
      <div className="island-content">
        <p className="caller-name">{caller} t’appelle…</p>

        <div className="island-buttons">
          <button className="decline" onClick={onDecline}>Refuser</button>
          <button className="accept" onClick={onAccept}>Accepter</button>
        </div>
      </div>
    </div>
  );
}
