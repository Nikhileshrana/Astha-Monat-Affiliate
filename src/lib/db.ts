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

  // Company Settings collections
  COMPANY_SETTINGS: "CompanySettings",

  // Appointment Settings collections
  APPOINTMENT_SETTINGS: "AppointmentSettings",

  // Appointment collections
  APPOINTMENTS: "Appointments",

  // Patient collections
  PATIENTS: "Patients",

  // Patient Queue
  PATIENTQUEUE: "PatientQueue",

  /** Doctors with nested services (name, description, price) */
  DOCTORS: "Doctors",

  // Website Configuration
  WEBSITE_CONFIG: "WebsiteConfig",

  // Bills / Sales
  BILLS: "Bills",

  // Hospital pharmacy — one document per product (SKU), batches[] for stock lines
  PHARMACY_INVENTORY: "PharmacyInventory",

  /** Single-doc pharmacy invoice branding (logo, bank, UPI, terms) */
  PHARMACY_CONFIG: "PharmacyConfig",
} as const;