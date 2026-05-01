import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjusted path to look for .env in the Backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
}

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('payrolls');

        // 1. Find all documents that have 'employeeId' but no 'employee'
        const legacyDocs = await collection.find({ 
            employeeId: { $exists: true }, 
            employee: { $exists: false } 
        }).toArray();

        console.log(`Found ${legacyDocs.length} legacy documents to migrate.`);

        for (const doc of legacyDocs) {
            await collection.updateOne(
                { _id: doc._id },
                { 
                    $set: { employee: doc.employeeId },
                    $unset: { employeeId: "" }
                }
            );
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
