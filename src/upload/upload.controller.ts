import { Controller, Post, UploadedFiles, UseInterceptors, Get, Body } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage} from 'multer';
import { UploadService } from './upload.service';
@Controller('upload')

export class UploadController {
    @Get()
    getUpload(): string {
        return 'Hello, this is the upload endpoint!';
    }

    @Post()
    @UseInterceptors(
        FilesInterceptor('files', 10, { // 👈 key phải là 'files' (giống React append)
            storage: memoryStorage(),
        }),
    )
    createUpload(@UploadedFiles() files: Express.Multer.File[]) {
        console.log('file')
        return (
            
            files.map((file) => ({
                filename : file.originalname
            }))
        )
        
    }


}
