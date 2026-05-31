import { NextResponse } from "next/server";
import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";

export async function POST(req: Request) {
  await dbConnect();

  const { from, to } = await req.json();

  const receiver = await User.findOne({ username: to });
  const sender = await User.findOne({ username: from });

  if (!receiver || !sender) {
    return NextResponse.json({
      ok: false,
      message: "Utilisateur introuvable",
    });
  }

  // Retirer des pending
  receiver.pendingReceived = receiver.pendingReceived.filter((u: string) => u !== from);
  sender.pendingSent = sender.pendingSent.filter((u: string) => u !== to);

  await receiver.save();
  await sender.save();

  return NextResponse.json({
    ok: true,
    message: "Demande refusée",
  });
}
