import Pusher from "pusher";
import PusherClient from "pusher-js";

// ----------------------
// SERVER PUSHER (API)
// ----------------------
export const serverPusher =
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.PUSHER_CLUSTER
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER,
        useTLS: true,
      })
    : null;

// ----------------------
// CLIENT PUSHER (Browser)
// ----------------------
let client: PusherClient | null = null;

if (typeof window !== "undefined") {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (key && cluster) {
    client = new PusherClient(key, { cluster });
  }
}

export const clientPusher = client;
