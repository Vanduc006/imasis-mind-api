import { Controller, Post, UploadedFiles, UseInterceptors, Get, Body, Param, Query, Sse, Res, UploadedFile } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage} from 'multer';
import { UploadService } from './upload.service';
import { Subject, timeout } from 'rxjs';
import { Response } from 'express';
import { LLMProcessor } from 'src/llm/llm.processor';
import { LlmService } from 'src/llm/llm.service';

@Controller('upload')

export class UploadController {
    private readonly progressSuject = new Subject<any>()
    constructor(
        private readonly UploadService : UploadService,
        private readonly LlmService : LlmService,
        // private readonly LLMProcessor : LLMProcessor,
    ) {}
    
    @Post()
    @UseInterceptors(
        FileInterceptor('file',{
            storage : memoryStorage(),
        })
    )
    async createUploadObject(
        @UploadedFile() file: Express.Multer.File,
        @Body('data') rawData : string,
    ) {
        const parseData = JSON.parse(rawData)
        // use by parseData.UserID ...
        const url = await this.UploadService.postPreginedURL(parseData.fileID,parseData.timeout)
        await this.LlmService.enqueueLLMJob({
            file,
            userID : parseData.userID,
            collectionName : parseData.collectionName,
            spaceID : parseData.spaceID,
            fileID : parseData.fileID,
            size : parseData.size,
            originalName : parseData.originalName,
        })
        return({
            timeout: parseData.timeout,
            key : parseData.fileID,
            url : url,
            size : parseData.size,

        })
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
    async createPresigned(
        @Query('key') key: string, 
        @Query('timeout') timeout: number) {
        const url = await this.UploadService.getPresignedURL(key,timeout)
        return({
            timeout: timeout,
            key : key,
            url : url,
         
        })
    }

    @Post('presignedpost')
    async createSignedPost(
        @Body('spaceid') spaceID : string,
        @Body('key') key:string, 
        @Body('timeout') timeout : number, 
        @Body('size') size : number ) {
        const url = await this.UploadService.postPreginedURL(key,timeout)
        this.progressSuject.next({
            data : {
                score : 10,
                description : '[AWS S3] Create signed'
            }
        })
        return({
            timeout: timeout,
            key : key,
            url : url,
            size : size,

        })
    }
    @Get('progress')
    @Sse('progress') 
    sendProgress(@Res() res: Response) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*'); // Nếu dùng CORS
        setTimeout(() => {
            this.progressSuject.complete();  // Đóng kết nối khi hoàn thành
            res.end();  // Đảm bảo kết nối được đóng khi hoàn tất
          }, 3000);
        return this.progressSuject.asObservable()
    }
 

}
