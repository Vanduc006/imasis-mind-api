import { Body, Controller, Get, Post, Res, Sse, UploadedFile, UseInterceptors } from '@nestjs/common';
import { LlmService } from './llm.service';
import { TransformfileService } from 'src/transformfile/transformfile.service';
// import { ENV } from 'config/env';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Subject } from 'rxjs';
import { Response } from 'express';

@Controller('llm')
export class LlmController {
    private readonly progressSuject = new Subject<any>()
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
        this.progressSuject.next({
            data: {
              score: 10,
              description: '[MIND] Open file'
            }
          });

        // 1 prase pdf
        const extract = await this.TransformfileService.PrasePDF(file)
        this.progressSuject.next({
            data: {
              score: 10,
              description: '[MIND] Parse PDF'
            }
          });
        
        const chunks = await this.LlmService.langchainChunk(extract)
          
        // 2 moderation
        const moderation = await this.LlmService.moderationGPT(extract)
        this.progressSuject.next({
            data: {
              score: 10,
              description: '[MIND] Understading content'
            }
          });

        // 3 embedding
        const embedding = await this.LlmService.geminiEmbedding(extract)
        this.progressSuject.next({
            data: {
              score: 10,
              description: '[MIND] Dive into context'
            }
          });

        // 4 store vector
        const storeVector = await this.LlmService.storeEmbedding(embedding,'123','pdf','1','test.pdf')
        this.progressSuject.next({
            data: {
              score: 10,
              description: '[MIND] Deepsearch'
            }
          });
        return ({
            extract : extract,
            embedding : embedding,
            langchain : chunks,
            moderation : moderation.results[0].flagged,
            qdrant : storeVector,
            // embedding : embedding,
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

    // @Get('moderation')
    // async createModeration(@Body('content') content : string) {
    //     const respone = await this.LlmService.moderationGPT(content)
    //     return ({
    //         moderation : respone,
    //         flagged : respone.results[0].flagged,
    //     })
    // }

    

}
