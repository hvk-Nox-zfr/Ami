import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth"; // ✔ important
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  await connectDB();

  const session = (await getServerSession(authOptions)) as Session; // ✔ cast propre

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { friendUsername } = await req.json();

  if (!friendUsername) {
    return NextResponse.json(
      { error: "friendUsername manquant" },
      { status: 400 }
    );
  }

  // ✔ utilisateur connecté
  const me = await User.findOne({ email: session.user.email });

  if (!me) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  // ✔ trouver l’ami par pseudo
  const friend = await User.findOne({ username: friendUsername });

  if (!friend) {
    return NextResponse.json(
      { error: "Pseudo introuvable" },
      { status: 404 }
    );
  }

  if (friend.email === me.email) {
    return NextResponse.json(
      { error: "Tu ne peux pas t'ajouter toi-même" },
      { status: 400 }
    );
  }

  if (me.friends.includes(friend.email)) {
    return NextResponse.json(
      { error: "Déjà amis" },
      { status: 400 }
    );
  }

  me.friends.push(friend.email);
  await me.save();

  return NextResponse.json({ success: true });
}
