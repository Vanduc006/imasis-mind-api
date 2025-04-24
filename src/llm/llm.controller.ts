import { Body, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { LlmService } from './llm.service';
import { TransformfileService } from 'src/transformfile/transformfile.service';
// import { ENV } from 'config/env';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
@Controller('llm')
export class LlmController {
    constructor(
        private readonly LlmService : LlmService,
        private readonly TransformfileService : TransformfileService,
    ) {}

    @Post('embeddingPDF') 
    @UseInterceptors(
        FileInterceptor('file',{
            storage : memoryStorage(),
        })
    )
    async createEmbedding(@UploadedFile() file: Express.Multer.File) {
        const extract = await this.TransformfileService.PrasePDF(file)
        // const extractContent = extract.originContent.text
        const moderation = await this.LlmService.moderationGPT(extract)
        const embedding = await this.LlmService.geminiEmbedding(extract)
        return ({
            extract : extract,
            embedding : embedding,
            moderation : moderation.results[0].flagged,
            // embedding : embedding,
        })
    }

    // @Get('moderation')
    // async createModeration(@Body('content') content : string) {
    //     const respone = await this.LlmService.moderationGPT(content)
    //     return ({
    //         moderation : respone,
    //         flagged : respone.results[0].flagged,
    //     })
    // }

    

}
