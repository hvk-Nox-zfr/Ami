import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  await connect();

  const { username } = await req.json();

  if (!username) {
    return NextResponse.json({ users: [] });
  }

  const users = await User.find({
    username: { $regex: username, $options: "i" },
  }).select("username email avatar");

  return NextResponse.json({ users });
}
