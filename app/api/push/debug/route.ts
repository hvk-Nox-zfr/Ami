import { NextResponse } from "next/server";
import PushSubscription from "@/models/PushSubscription";
import "@/lib/mongodb";

export async function GET() {
  const subs = await PushSubscription.find({});
  return NextResponse.json(subs);
}
