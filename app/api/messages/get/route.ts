import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connect from "@/lib/mongodb";
import Message from "@/models/Message";
import User from "@/models/User"; // ⭐ IMPORTANT

export async function POST(req: Request) {
  await connect();

  const session = (await getServerSession(authOptions)) as Session;

  if (!session?.user?.email) {
    return NextResponse.json({ messages: [] });
  }

  const { otherUser } = await req.json();

  if (!otherUser || typeof otherUser !== "string") {
    return NextResponse.json({ messages: [] });
  }

  const selfEmail = session.user.email;

  // ⭐ On récupère l'email de l'autre utilisateur
  const other = await User.findOne({ username: otherUser });

  if (!other) {
    return NextResponse.json({ messages: [] });
  }

  const otherEmail = other.email;

  // ⭐ On cherche les messages par EMAILS
  const messages = await Message.find({
    $or: [
      { sender: selfEmail, receiver: otherEmail },
      { sender: otherEmail, receiver: selfEmail },
    ],
  }).sort({ timestamp: 1 });

  return NextResponse.json({ messages });
}
