import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../../.env');

dotenv.config({ path: envPath });

const fixReviewIndexes = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI not found in environment variables. Make sure .env file exists in backend root.');
        }
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('reviews');

        // Get all existing indexes
        let indexArray = await collection.listIndexes().toArray();
        const indexNames = indexArray.map(idx => idx.name);
        console.log('Current indexes:', indexNames);

        // Drop ALL indexes except _id
        for (const index of indexArray) {
            if (index.name !== '_id_') {
                try {
                    await collection.dropIndex(index.name);
                    console.log(`Dropped index: ${index.name}`);
                } catch (err) {
                    console.log(`Could not drop index ${index.name}:`, err.message);
                }
            }
        }

        console.log('Waiting for indexes to drop...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Recreate only the correct indexes
        console.log('\nCreating new indexes...');

        // Index for professional reviews
        await collection.createIndex(
            { professionalId: 1, reviewerId: 1 },
            {
                unique: true,
                partialFilterExpression: { professionalId: { $ne: null } }
            }
        );
        console.log('✓ Created professionalId + reviewerId index');

        // Index for company reviews
        await collection.createIndex(
            { companyId: 1, reviewerId: 1 },
            {
                unique: true,
                partialFilterExpression: { companyId: { $ne: null } }
            }
        );
        console.log('✓ Created companyId + reviewerId index');

        // Verify new indexes
        indexArray = await collection.listIndexes().toArray();
        const finalIndexNames = indexArray.map(idx => idx.name);
        console.log('\nFinal indexes:', finalIndexNames);
        console.log('\n✓ Index fix complete! You can now review multiple professionals.');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing indexes:', error);
        process.exit(1);
    }
};

fixReviewIndexes();
