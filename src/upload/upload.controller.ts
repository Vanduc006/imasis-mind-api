import { Controller, Post, UploadedFiles, UseInterceptors, Get, Body } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage} from 'multer';
import { UploadService } from './upload.service';
import { LlmService } from 'src/llm/llm.service';
import { console } from 'inspector';
@Controller('upload')

export class UploadController {
    constructor(private readonly UploadService : UploadService, private readonly LlmService : LlmService) {}
    
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
    async createUpload(@UploadedFiles() files: Express.Multer.File[]) {
        console.log('file')
        // let data
        const dataArray = Promise.all(
            files.map(async(file) => {
                const extract = await this.UploadService.PrasePDF(file)
                return ({
                    numpages : extract.numpages,
                    infor : extract.info,
                    text : extract.text,
                    metadata : extract.metadata,
                })
            })
        )
        return ( dataArray
            // data
            // files.map((file) => ({
            //     data : this.UploadService.PrasePDF(file)
            //     // @UploadService.PrasePDF(file)
            //     // filename : file.originalname
            // }))
        )
        
    }
    @Post('embedding')
    async createEmbedding(@Body('content') content : string ) {
        console.log('1')
        const embedding = await this.LlmService.geminiEmbedding(content)
        return ({
            originContent : content,
            embedding : embedding,
        })
    }


}
