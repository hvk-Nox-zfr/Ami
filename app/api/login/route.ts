import { NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    await connect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Email introuvable" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 400 });
    }

    return NextResponse.json({ message: "Connexion réussie", userId: user._id });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
