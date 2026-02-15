import { MongoClient } from 'mongodb';

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
	throw new Error('Please define MONGODB_URI in environment.');
}

client = new MongoClient(MONGODB_URI, options);
clientPromise = client.connect();

export default clientPromise;
