import { NextResponse } from "next/server";
import User from "@/models/User";
import connect from "@/lib/mongodb";

export async function POST(req: Request) {
  await connect();

  const { from, to } = await req.json();

  // Vérifier que les deux utilisateurs existent
  const sender = await User.findOne({ username: from });
  const receiver = await User.findOne({ username: to });

  if (!sender || !receiver) {
    return NextResponse.json({
      ok: false,
      message: "Utilisateur introuvable",
    });
  }

  // Déjà amis ?
  if (sender.friends.includes(to)) {
    return NextResponse.json({
      ok: false,
      message: "Vous êtes déjà amis",
    });
  }

  // L'autre t'a déjà envoyé une demande → auto accept
  if (sender.pendingReceived.includes(to)) {
    sender.pendingReceived = sender.pendingReceived.filter((u: string) => u !== to);
    receiver.pendingSent = receiver.pendingSent.filter((u: string) => u !== from);

    sender.friends.push(to);
    receiver.friends.push(from);

    await sender.save();
    await receiver.save();

    return NextResponse.json({
      ok: true,
      autoAccepted: true,
      message: "Demande mutuelle, amitié confirmée",
    });
  }

  // Sinon → demande normale
  if (!sender.pendingSent.includes(to)) {
    sender.pendingSent.push(to);
  }

  if (!receiver.pendingReceived.includes(from)) {
    receiver.pendingReceived.push(from);
  }

  await sender.save();
  await receiver.save();

  return NextResponse.json({
    ok: true,
    message: "Demande d'ami envoyée",
  });
}
