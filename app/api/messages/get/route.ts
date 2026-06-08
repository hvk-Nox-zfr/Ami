import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connect from "@/lib/mongodb";
import Message from "@/models/Message";
import User from "@/models/User";

export async function POST(req: Request) {
  await connect();

  const session = (await getServerSession(authOptions)) as Session;

  if (!session?.user?.email) {
    return NextResponse.json({ messages: [] });
  }

  const { otherUser } = await req.json();
  if (!otherUser) return NextResponse.json({ messages: [] });

  const selfEmail = session.user.email;

  // On récupère l'email de l'autre user
  const other = await User.findOne({ username: otherUser });
  if (!other) return NextResponse.json({ messages: [] });

  const otherEmail = other.email;

  // On récupère les messages
  const rawMessages = await Message.find({
    $or: [
      { sender: selfEmail, receiver: otherEmail },
      { sender: otherEmail, receiver: selfEmail },
    ],
  }).sort({ timestamp: 1 });

  // ⭐ On convertit email → username pour le front
  const messages = await Promise.all(
    rawMessages.map(async (m) => {
      const senderUser = await User.findOne({ email: m.sender });
      const receiverUser = await User.findOne({ email: m.receiver });

      return {
        from: senderUser?.username || "unknown",
        to: receiverUser?.username || "unknown",
        text: m.text,
        time: m.timestamp,
      };
    })
  );

  return NextResponse.json({ messages });
}
