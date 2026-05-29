import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Message from "@/lib/models/Message";

export async function POST(req: Request) {
  await connectDB();

  const session = (await getServerSession(authOptions)) as Session;

  if (!session?.user?.email) {
    return NextResponse.json({ messages: [] });
  }

  const { otherUser } = await req.json();

  if (!otherUser || typeof otherUser !== "string") {
    return NextResponse.json({ messages: [] });
  }

  const userEmail = session.user.email;

  const messages = await Message.find({
    $or: [
      { sender: userEmail, receiver: otherUser },
      { sender: otherUser, receiver: userEmail },
    ],
  }).sort({ timestamp: 1 });

  return NextResponse.json({ messages });
}
