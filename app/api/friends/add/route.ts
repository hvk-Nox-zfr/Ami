import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  await connect();

  const session = (await getServerSession(authOptions)) as Session;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { friendUsername } = await req.json();

  if (!friendUsername) {
    return NextResponse.json({ error: "friendUsername manquant" }, { status: 400 });
  }

  const me = await User.findOne({ email: session.user.email });
  const friend = await User.findOne({ username: friendUsername });

  if (!me || !friend) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  if (me.username === friend.username) {
    return NextResponse.json({ error: "Tu ne peux pas t'ajouter toi-même" }, { status: 400 });
  }

  // Déjà amis ?
  if (me.friends.includes(friend.username)) {
    return NextResponse.json({ error: "Déjà amis" }, { status: 400 });
  }

  // Déjà une demande envoyée ?
  if (me.pendingSent.includes(friend.username)) {
    return NextResponse.json({ error: "Demande déjà envoyée" }, { status: 400 });
  }

  // Déjà une demande reçue ?
  if (me.pendingReceived.includes(friend.username)) {
    return NextResponse.json({ error: "Cette personne t’a déjà envoyé une demande" }, { status: 400 });
  }

  // 🔥 ENVOI DE LA DEMANDE (par username)
  me.pendingSent.push(friend.username);
  friend.pendingReceived.push(me.username);

  await me.save();
  await friend.save();

  return NextResponse.json({ success: true });
}
