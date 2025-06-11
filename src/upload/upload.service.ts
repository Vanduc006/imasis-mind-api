import { Injectable } from '@nestjs/common';
// import { v2 as cloudinary } from 'cloudinary'; 
import { GetObjectCommand, S3Client, GetObjectCommandInput } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
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

    async getPresignedURL(key: string, exprise: number):Promise<string> {
      const params: GetObjectCommandInput = {
        Bucket: this.bucketname,
        Key: key,
        ResponseContentDisposition: "inline",
      }
      const command = new GetObjectCommand(params)
      const url = await getSignedUrl(this.s3, command, {expiresIn: exprise})
      return url
    }

    async postPreginedURL(key: string, exprise: number):Promise<any> {
      const url = await createPresignedPost(this.s3, {
        Bucket : this.bucketname,
        Key : key,
        Expires : exprise,
        // Conditions : [
        //   ['content-length-range', 0, 1024 * 1024 * 1024],
        // ]
      })
      return url
    }
}
