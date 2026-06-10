"use client";

import "./globals.css";
import { useEffect } from "react";

export const metadata = {
  title: "Ami",
  description: "Application Ami",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Enregistrement du Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("Service Worker enregistré"))
        .catch((err) => console.error("Erreur SW :", err));
    }
  }, []);

  return (
    <html lang="fr">
      <head>
        {/* Manifest PWA */}
        <link rel="manifest" href="/manifest.json" />

        {/* Couleur de la barre d'état */}
        <meta name="theme-color" content="#000000" />

        {/* Icônes iPhone */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

        {/* Autoriser l'app en mode standalone sur iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>

      <body>{children}</body>
    </html>
  );
}
