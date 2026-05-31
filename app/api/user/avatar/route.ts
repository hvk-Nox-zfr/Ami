import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";

export async function POST(req: Request) {
  await connectDB();

  // Typage propre pour éviter les erreurs TS
  const session = (await getServerSession(authOptions)) as Session | null;

  // Vérification obligatoire
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const avatar: string = body?.avatar ?? "";

  // Vérification avatar
  if (typeof avatar !== "string" || avatar.length < 1) {
    return NextResponse.json(
      { error: "Avatar invalide" },
      { status: 400 }
    );
  }

  // Mise à jour de l'utilisateur
  await User.updateOne(
    { email: session.user.email },
    { $set: { avatar } }
  );

  return NextResponse.json({ success: true });
}
