import { MongoClient } from 'mongodb';

// MongoDB bağlantı URI'niz. Güvenlik için bu .env dosyasında olmalı.
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Lütfen .env.local dosyasına MONGODB_URI değişkenini ekleyin.');
}

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Burada, TypeScript'e 'MONGODB_URI' değişkeninin kesinlikle boş olmadığını (!) söylüyoruz.
  const client = await MongoClient.connect(MONGODB_URI!);
  const dbName = new URL(MONGODB_URI!).pathname.substring(1);
  const db = client.db(dbName);
  
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
