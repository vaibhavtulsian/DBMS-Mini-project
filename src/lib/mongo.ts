import { MongoClient, Db, Collection, Document } from 'mongodb';

// MongoDB Connection Configuration for Master Catalog & Audit Store
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:mongo@localhost:27017';
const MONGO_DB_NAME = process.env.MONGO_DATABASE || 'wholesale_catalog';

let client: MongoClient;
let db: Db;

declare global {
  var _mongoClient: MongoClient | undefined;
}

async function getMongoClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'production') {
    if (!client) {
      client = new MongoClient(MONGO_URI);
      await client.connect();
    }
    return client;
  } else {
    if (!global._mongoClient) {
      global._mongoClient = new MongoClient(MONGO_URI);
      await global._mongoClient.connect();
    }
    return global._mongoClient;
  }
}

/**
 * Returns the connected MongoDB database instance
 */
export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(MONGO_DB_NAME);
}

/**
 * Returns a typed MongoDB collection
 */
export async function getCollection<T extends Document = Document>(
  name: string
): Promise<Collection<T>> {
  const db = await getMongoDb();
  return db.collection<T>(name);
}

/**
 * Query helper: find documents in a collection with optional filter and options
 */
export async function mongoQuery<T extends Document = Document>(
  collectionName: string,
  filter: Record<string, any> = {},
  options?: { sort?: Record<string, 1 | -1>; limit?: number; projection?: Record<string, 0 | 1> }
): Promise<T[]> {
  const collection = await getCollection<T>(collectionName);
  let cursor = collection.find(filter);
  if (options?.sort) cursor = cursor.sort(options.sort);
  if (options?.limit) cursor = cursor.limit(options.limit);
  if (options?.projection) cursor = cursor.project(options.projection);
  return cursor.toArray() as Promise<T[]>;
}

/**
 * Insert a single document into a collection
 */
export async function mongoInsertOne(
  collectionName: string,
  doc: Record<string, any>
): Promise<any> {
  const collection = await getCollection(collectionName);
  return collection.insertOne(doc);
}

/**
 * Returns the raw MongoClient for transaction support
 */
export async function getMongoClient_(): Promise<MongoClient> {
  return getMongoClient();
}

export default getMongoDb;
