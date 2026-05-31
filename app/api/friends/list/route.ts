import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  await connectDB();

  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ friends: [] });
  }

  const me = await User.findOne({ email: session.user.email }).lean();

  if (!me) {
    return NextResponse.json({ friends: [] });
  }

  // 🔥 ON AJOUTE online ICI
  const friends = await User.find(
    { email: { $in: me.friends } },
    { username: 1, avatar: 1, online: 1 } // <--- IMPORTANT
  ).lean();

  return NextResponse.json({
    friends: friends.map((f) => ({
      _id: f._id.toString(),
      username: f.username,
      avatar: f.avatar || "",
      online: f.online ?? false, // <--- ON RENVOIE LE STATUT
    })),
  });
}
