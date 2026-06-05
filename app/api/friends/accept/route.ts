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
    return NextResponse.json({ ok: false, message: "Non autorisé" });
  }

  const { from } = await req.json(); // username de l'autre

  if (!from) {
    return NextResponse.json({ ok: false, message: "Champ 'from' manquant" });
  }

  // Celui qui accepte
  const me = await User.findOne({ email: session.user.email });
  // Celui qui a envoyé la demande
  const sender = await User.findOne({ username: from });

  if (!me || !sender) {
    return NextResponse.json({ ok: false, message: "Utilisateur introuvable" });
  }

// Retirer la demande reçue
me.pendingReceived = me.pendingReceived.filter((u: string) => u !== from);

// Retirer la demande envoyée
sender.pendingSent = sender.pendingSent.filter((u: string) => u !== me.username);

  // Ajouter en amis (par username)
  me.friends.push(sender.username);
  sender.friends.push(me.username);

  await me.save();
  await sender.save();

  return NextResponse.json({ ok: true, message: "Demande acceptée" });
}
