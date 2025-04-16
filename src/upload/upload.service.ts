import { Injectable } from '@nestjs/common';
import * as pdf from 'pdf-parse';
import { v2 as cloudinary } from 'cloudinary'; 
import 'dotenv/config'
@Injectable()

export class UploadService { 
    async transferCloud(file : Express.Multer.File) {
        cloudinary.config({ 
            cloud_name: process.env.HELLO, 
            api_key: 'my_key', 
            api_secret: 'my_secret'
        });
    }
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
}
