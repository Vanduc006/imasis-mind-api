// Cách 1: Gọn gàng
import 'dotenv/config';

interface Env {
  QDRANT_API_KEY: string;
  QDRANT_URL: string;
  QDRANT_PORT : number;
  GEMINI_API_KEY: string;
  S3_BUCKET_NAME: string;
  AWS_ACCESS_KEY: string;
  AWS_SECRET_KEY: string;
}

export const ENV: Env = {
  QDRANT_API_KEY: process.env.QDRANT_API_KEY || '',
  QDRANT_URL: process.env.QDRANT_URL || '',
  QDRANT_PORT: Number(process.env.QDRANT_PORT),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '',
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY || '',
  AWS_SECRET_KEY: process.env.AWS_SECRET_KEY || '',
};
