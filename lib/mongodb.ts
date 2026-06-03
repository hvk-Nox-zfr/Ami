import mongoose from "mongoose";

const uri: string = process.env.MONGODB_URI!;

if (!uri) {
  throw new Error("❌ MONGODB_URI manquant dans .env");
}

let cached = (global as any).mongoose || { conn: null, promise: null };

export default async function connect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => m);
  }

  cached.conn = await cached.promise;
  (global as any).mongoose = cached;

  return cached.conn;
}
