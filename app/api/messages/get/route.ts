import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    const self = session?.user?.username;

    if (!self) {
      return NextResponse.json({ messages: [] });
    }

    const body = await req.json();
    const otherUser = body.otherUser;

    const client = await clientPromise;
    const db = client.db("ami");

    const messages = await db
      .collection("messages")
      .find({
        $or: [
          { from: self, to: otherUser },
          { from: otherUser, to: self },
        ],
      })
      .sort({ time: 1 })
      .toArray();

    return NextResponse.json({ messages });
  } catch (err) {
    return NextResponse.json({ messages: [] });
  }
}
