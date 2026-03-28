import dotenv from 'dotenv';
dotenv.config();
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    }
});

const uploadToS3 = async (file, category = 'general') => {
    try {
        const fileName = `${Date.now()}-${file.originalname}`; 

        const key = `${category}/${fileName}`;

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            CacheControl: 'public, max-age=31536000'
        };

        await s3.send(new PutObjectCommand(params));

        const fileUrl = `${process.env.CDN_URL}/${key}`;

        return {
            key,
            url: fileUrl
        };

    } catch (error) {
        throw error;
    }
};

export const deleteFromS3 = async (key) => {
    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        };

        await s3.send(new DeleteObjectCommand(params));
    } catch (error) {
        console.error('Error deleting from S3:', error);
    }
}

export default uploadToS3;