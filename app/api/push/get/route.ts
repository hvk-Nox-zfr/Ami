import { NextResponse } from "next/server";
import PushSubscription from "@/models/PushSubscription";
import "@/lib/mongodb";

export async function POST(req: Request) {
  const { username } = await req.json();

  const sub = await PushSubscription.findOne({ username });

  return NextResponse.json({ subscription: sub?.subscription || null });
}
