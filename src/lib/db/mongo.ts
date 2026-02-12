import { MongoClient } from 'mongodb';
import { building, dev } from '$app/environment';
import { env } from "$env/dynamic/private";

const options = {};

let client : MongoClient;
let clientPromise: Promise<MongoClient>;

const MONGODB_URI = env.MONGODB_URI!;

if (dev) {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else if(!building) {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
// @ts-expect-error
export default clientPromise;
