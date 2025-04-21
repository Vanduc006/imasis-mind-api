import { Injectable } from '@nestjs/common';
import * as pdf from 'pdf-parse';
import { v2 as cloudinary } from 'cloudinary'; 
import { GetObjectCommand, S3Client, GetObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ENV } from 'config/env';
@Injectable()

export class UploadService { 
    private readonly s3:S3Client
    private readonly bucketname = "mind-aws3-bucket"

    constructor() {
      this.s3 = new S3Client({
        region : "ap-southeast-2",
        credentials: {
          accessKeyId: ENV.AWS_ACCESS_KEY,
          secretAccessKey: ENV.AWS_SECRET_KEY,
        }
      })
    }
    // async transferCloud(file : Express.Multer.File) {
    //     cloudinary.config({ 
    //         cloud_name: process.env.HELLO, 
    //         api_key: 'my_key', 
    //         api_secret: 'my_secret'
    //     });
    // }
    async PrasePDF(file : Express.Multer.File) {
        try {
            const data = await pdf(file.buffer); 
            // console.log(data.info)
            return data;
            
          } catch (error) {
            console.error('PDF parse error:', error);
            return error;
          }
    }
    async getPresignedURL(key: string, exprise: number):Promise<string> {
      const params: GetObjectCommandInput = {
        Bucket: this.bucketname,
        Key: key,
      }
      const command = new GetObjectCommand(params)
      const url = await getSignedUrl(this.s3, command, {expiresIn: exprise})
      return url
    }
}
