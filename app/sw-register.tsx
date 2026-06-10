"use client";

import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("Service Worker enregistré"))
        .catch((err) => console.error("Erreur SW :", err));
    }
  }, []);

  return null;
}
