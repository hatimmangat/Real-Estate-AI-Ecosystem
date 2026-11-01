import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

 
if (!supabaseUrl) {
    throw new Error('SUPABASE_URL or VITE_SUPABASE_URL environment variable is not set');
}

if (!supabaseKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. Image deletion will fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey || '');

export const extractSupabaseFilePath = (imageUrl) => {
    try {
        const url = new URL(imageUrl);
        const pathname = url.pathname;

        const parts = pathname.split('/');

        // Find the index of 'public' and get everything after it
        const publicIndex = parts.indexOf('public');
        if (publicIndex === -1) {
            console.error('Invalid Supabase URL format:', imageUrl);
            return null;
        }

        const bucket = parts[publicIndex + 1];
        const filePath = parts.slice(publicIndex + 2).join('/');

        return { bucket, filePath };
    } catch (error) {
        console.error('Error extracting file path from URL:', error);
        return null;
    }
};

export const deleteImageFromSupabase = async (imageUrl) => {
    try {
        if (!imageUrl || !supabaseKey) {
            return false;
        }

        const fileInfo = extractSupabaseFilePath(imageUrl);
        if (!fileInfo) {
            return false;
        }

        const { bucket, filePath } = fileInfo;

        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            console.error('Error deleting image from Supabase:', error);
            return false;
        }

        console.log(`Image deleted successfully: ${filePath}`);
        return true;
    } catch (error) {
        console.error('Error in deleteImageFromSupabase:', error);
        return false;
    }
};

export const deleteImagesFromSupabase = async (imageUrls) => {
    let successCount = 0;
    let failureCount = 0;

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        return { successCount: 0, failureCount: 0 };
    }

    try {
        const filesByBucket = {};

        for (const imageUrl of imageUrls) {
            const fileInfo = extractSupabaseFilePath(imageUrl);
            console.log("fileinfo", fileInfo);
            if (fileInfo) {
                const { bucket, filePath } = fileInfo;
                console.log("bucket", bucket);
                console.log("filePath", filePath);
                if (!filesByBucket[bucket]) {
                    filesByBucket[bucket] = [];
                }
                filesByBucket[bucket].push(filePath);
            }
        }

        for (const [bucket, filePaths] of Object.entries(filesByBucket)) {
            const { error } = await supabase.storage
                .from(bucket)
                .remove(filePaths);

            if (error) {
                console.error(`Error deleting images from bucket ${bucket}:`, error);
                failureCount += filePaths.length;
            } else {
                console.log(`Deleted ${filePaths.length} images from bucket ${bucket}`);
                successCount += filePaths.length;
            }
        }
    } catch (error) {
        console.error('Error in deleteImagesFromSupabase:', error);
        failureCount += imageUrls.length;
    }

    return { successCount, failureCount };
};

export default supabase;
