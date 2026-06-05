import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  await connect();

  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({
      pendingReceived: [],
      pendingSent: [],
      friends: [],
    });
  }

  const me = await User.findOne({ email: session.user.email }).lean();

  if (!me) {
    return NextResponse.json({
      pendingReceived: [],
      pendingSent: [],
      friends: [],
    });
  }

  // 🔥 Récupérer les infos des amis
  const friendsData = await User.find(
    { email: { $in: me.friends } },
    { username: 1, avatar: 1, online: 1 }
  ).lean();

  return NextResponse.json({
    pendingReceived: me.pendingReceived || [],
    pendingSent: me.pendingSent || [],
    friends: friendsData.map((f) => ({
      _id: f._id.toString(),
      username: f.username,
      avatar: f.avatar || "",
      online: f.online ?? false,
    })),
  });
}
