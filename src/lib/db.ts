import { MongoClient, MongoClientOptions } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

const options: MongoClientOptions = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000
};
const client = new MongoClient(process.env.MONGODB_URI || "", options);

// Attach the client to ensure proper cleanup on function suspension
attachDatabasePool(client);

// Export a module-scoped MongoClient to ensure the client can be shared across functions.
export default client;

export const DB_NAME = process.env.DB_NAME;

// Collection names
export const COLLECTIONS = {
  // Users collections
  USERS_COLLECTION: "Users",

  // Software Access collections
  SOFTWARE_ACCESS: "SoftwareAccess",

  //QUIZ Results collections
  HAIR_QUIZ_FORMS: "HairQuizForms",
  AFFILIATE_APPLICATIONS: "AffiliateApplications",

} as const;