import { Controller, Post, UploadedFiles, UseInterceptors, Get, Body, Param, Query } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage} from 'multer';
import { UploadService } from './upload.service';

@Controller('upload')

export class UploadController {
    constructor(private readonly UploadService : UploadService) {}
    
    @Get()
    getUpload(): string {
        return 'this is route for upload function';
    }

    // @Post()
    // @UseInterceptors(
    //     FilesInterceptor('files', 100, { // 👈 key phải là 'files' (giống React append)
    //         storage: memoryStorage(),
    //     }),
    // ) 
    // async createUpload(@UploadedFiles() files: Express.Multer.File[]) {
    //     const dataArray = Promise.all(
    //         files.map(async(file) => {
    //             const extract = await this.UploadService.PrasePDF(file)
    //             return ({
    //                 numpages : extract.numpages,
    //                 infor : extract.info,
    //                 text : extract.text,
    //                 metadata : extract.metadata,
    //             })
    //         })
    //     )
    //     return ( dataArray)
        
    // }

    @Post('presigned')
    async createPresigned(@Query('key') key: string, @Query('timeout') timeout: number) {
        const url = await this.UploadService.getPresignedURL(key,timeout)
        return({
            timeout: timeout,
            key : key,
            url : url,
         
        })
    }

    @Post('presignedpost')
    async createSignedPost(@Query('key') key:string, @Query('timeout') timeout : number, @Query('size') size : number ) {
        const url = await this.UploadService.postPreginedURL(key,timeout)
        return({
            timeout: timeout,
            key : key,
            url : url,
            size : size,

        })
    }

}
