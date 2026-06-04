import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import User from "@/models/User";
import connect from "@/lib/mongodb";

export async function POST() {
  await connect();

  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    await User.updateOne(
      { email: session.user.email },
      { $set: { online: false } }
    );
  }

  return NextResponse.json({ success: true });
}
