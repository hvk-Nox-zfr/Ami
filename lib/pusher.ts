import Pusher from "pusher";
import PusherClient from "pusher-js";

// ----------------------
// SERVER PUSHER (API)
// ----------------------
let serverPusher: Pusher | null = null;

if (
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.PUSHER_CLUSTER
) {
  serverPusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });
}

export { serverPusher };

// ----------------------
// CLIENT PUSHER (Browser)
// ----------------------
let clientPusher: PusherClient | null = null;

if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_PUSHER_KEY &&
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER
) {
  clientPusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  });
}

export { clientPusher };
