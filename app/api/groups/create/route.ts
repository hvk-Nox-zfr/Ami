import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth"; // ✔ comme ton exemple
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Group from "@/lib/models/Group";
import User from "@/lib/models/User"; // ✔ User propre, plus rouge

export async function POST(req: Request) {
  await connectDB();

  const session = (await getServerSession(authOptions)) as Session; // ✔ cast propre

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, members } = await req.json();

  if (!name || !Array.isArray(members)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // ✔ Convertir pseudos → emails
  const memberEmails: string[] = [];

  for (const username of members) {
    const user = await User.findOne({ username }); // ✔ User reconnu

    if (!user) {
      return NextResponse.json(
        { error: `User not found: ${username}` },
        { status: 404 }
      );
    }

    memberEmails.push(user.email);
  }

  // ✔ Ajouter le créateur
  if (!memberEmails.includes(session.user.email)) {
    memberEmails.push(session.user.email);
  }

  const group = await Group.create({
    name,
    members: memberEmails,
    createdBy: session.user.email,
  });

  return NextResponse.json({ group });
}
