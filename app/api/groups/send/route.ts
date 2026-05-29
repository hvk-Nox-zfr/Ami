import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import GroupMessage from "@/lib/models/GroupMessage";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  await connectDB();

  const { groupId } = await req.json();

  // On récupère les messages
  const messages = await GroupMessage.find({ groupId }).lean();

  // On ajoute le pseudo du sender
  const messagesWithUsername = await Promise.all(
    messages.map(async (msg: any) => {
      const user = await User.findOne({ email: msg.sender }).lean();

      return {
        ...msg,
        senderUsername: user?.username ?? msg.sender, // fallback email
      };
    })
  );

  return NextResponse.json({ messages: messagesWithUsername });
}
