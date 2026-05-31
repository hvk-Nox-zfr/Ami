import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";

export async function GET() {
  await connectDB();

  const session = (await getServerSession(authOptions)) as Session;

  if (!session?.user?.email) {
    return NextResponse.json({ groups: [] });
  }

  const groups = await Group.find({
    members: session.user.email,
  });

  return NextResponse.json({ groups });
}
