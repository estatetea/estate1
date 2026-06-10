import { MongoClient } from 'mongodb';

let clientPromise = null;

function getClientPromise() {
  if (clientPromise) return clientPromise;
  
  const uri = process.env.MONGO_URL;
  if (!uri) return null;

  const client = new MongoClient(uri);
  clientPromise = client.connect();
  return clientPromise;
}

export async function getDb() {
  const promise = getClientPromise();
  if (!promise) {
    throw new Error('MONGO_URL not configured');
  }
  const client = await promise;
  return client.db(process.env.DB_NAME || 'estate_tea');
}

export default getClientPromise;
