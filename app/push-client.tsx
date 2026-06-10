"use client";

import { useEffect } from "react";
import { VAPID_PUBLIC_KEY } from "../lib/env";

export default function PushClient({ username }: { username: string }) {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function subscribe() {
      const reg = await navigator.serviceWorker.ready;

      // On récupère la clé publique VAPID côté client
        const vapidKey = VAPID_PUBLIC_KEY;


      if (!vapidKey) {
        console.error("VAPID key manquante NEXT_PUBLIC_VAPID_PUBLIC");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      await fetch("/api/ppush/subscribe", {
        method: "POST",
        body: JSON.stringify({ username, subscription: sub })
      });
    }

    subscribe();
  }, [username]);

  return null;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
