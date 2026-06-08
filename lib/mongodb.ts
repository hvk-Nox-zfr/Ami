import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
if (!uri) throw new Error("❌ MONGODB_URI manquant dans .env");

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// @ts-ignore
if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  // @ts-ignore
  global._mongoClientPromise = client.connect();
}

// @ts-ignore
clientPromise = global._mongoClientPromise;

export default clientPromise;
