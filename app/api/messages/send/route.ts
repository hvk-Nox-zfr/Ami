import Pusher from "pusher";

export async function POST(request: Request) {
  // Empêche l'exécution pendant le build Vercel
  if (
    !process.env.PUSHER_KEY ||
    !process.env.PUSHER_SECRET ||
    !process.env.PUSHER_APP_ID
  ) {
    console.log("Pusher disabled during build");
    return Response.json({ ok: true });
  }

  const { message, to } = await request.json();

  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: "eu",
    useTLS: true,
  });

  await pusher.trigger(`chat-${to}`, "new-message", { message });

  return Response.json({ ok: true });
}
