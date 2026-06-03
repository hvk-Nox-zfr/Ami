import { NextResponse } from "next/server";
import User from "@/models/User"; // adapte selon ton chemin DB
import connect from "@/lib/mongodb";

export async function POST(req: Request) {
  await connect();

  const { username } = await req.json();

  if (!username) {
    return NextResponse.json({ users: [] });
  }

  const users = await User.find({
    name: { $regex: username, $options: "i" },
  }).select("name email");

  return NextResponse.json({ users });
}
