import { NextResponse } from "next/server";
import webpush from "web-push";
import PushSubscription from "@/models/PushSubscription";
import "@/lib/mongodb";

webpush.setVapidDetails(
  "mailto:contact@ami.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  const { username, title, body, url } = await req.json();

  if (!username) {
    return NextResponse.json({ ok: false, error: "Missing username" }, { status: 400 });
  }

  const sub = await PushSubscription.findOne({ username });
  if (!sub) {
    return NextResponse.json({ ok: false, error: "No subscription" }, { status: 404 });
  }

  try {
    await webpush.sendNotification(
      sub.subscription,
      JSON.stringify({
        title,
        body,
        url
      })
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push error:", err);
    return NextResponse.json({ ok: false, error: "Push failed" }, { status: 500 });
  }
}
