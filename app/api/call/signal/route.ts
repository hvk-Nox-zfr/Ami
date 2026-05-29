import { NextResponse } from "next/server";

let signals: Record<string, any[]> = {};

export async function POST(req: Request) {
  const body = (await req.json()) as {
    roomId: string;
    data: any;
  };

  const { roomId, data } = body;

  if (!signals[roomId]) signals[roomId] = [];

  signals[roomId].push(data);

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId") as string;

  const data = signals[roomId] || [];
  signals[roomId] = [];

  return NextResponse.json({ data });
}
