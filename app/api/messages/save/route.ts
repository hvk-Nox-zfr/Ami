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
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { from, to, text, time } = await req.json();

  if (!from || !to || !text) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Convertir username → email
  const receiver = await User.findOne({ username: to });
  if (!receiver) {
    return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
  }

  await Message.create({
    sender: session.user.email,
    receiver: receiver.email,
    text,
    timestamp: time || Date.now(),
  });

  return NextResponse.json({ ok: true });
}
