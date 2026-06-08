import { NextResponse } from "next/server";
import PushSubscription from "@/models/PushSubscription";
import "@/lib/mongodb"; // ton fichier de connexion mongoose

export async function POST(req: Request) {
  const { username, subscription } = await req.json();

  if (!username || !subscription) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await PushSubscription.findOneAndUpdate(
    { username },
    { subscription },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
