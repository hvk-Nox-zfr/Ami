import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  await connect();

  const { username } = await req.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const user = await User.findOne({ username });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ email: user.email });
}
