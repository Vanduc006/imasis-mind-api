import { Injectable } from '@nestjs/common';
import * as pdf from 'pdf-parse';

@Injectable()
export class TransformfileService {
    async PrasePDF(file : Express.Multer.File) {
        try {
            const data = await pdf(file.buffer); 
            // console.log(data.info)
            return data.text;
            
        } catch (error) {
            console.error('PDF parse error:', error);
            return error;
        }
    }
}
