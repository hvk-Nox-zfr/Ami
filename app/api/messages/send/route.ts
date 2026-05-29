import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import User from "@/lib/models/User";
import { serverPusher } from "@/lib/pusher";

export async function POST(req: Request) {
  await connectDB();

  const session = (await getServerSession(authOptions)) as Session;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { receiver, content } = await req.json();

  // receiver = pseudo → on récupère l'email
  const receiverUser = await User.findOne({ username: receiver });

  if (!receiverUser) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const newMessage = await Message.create({
    sender: session.user.email,
    receiver: receiverUser.email, // ✔ email correct
    content,
    timestamp: Date.now(),
  });

  await serverPusher.trigger("chat", "new-message", newMessage);

  return NextResponse.json({ success: true });
}
