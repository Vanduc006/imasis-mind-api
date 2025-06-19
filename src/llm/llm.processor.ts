import { Process,Processor } from "@nestjs/bull";
import { Job } from "bull";
import { LlmService } from "./llm.service";
import { DatabaseService } from "src/database/database.service";
import { TransformfileService } from "src/transformfile/transformfile.service";

@Processor('llmQueue')
export class LLMProcessor {
    // merge upload and embedding
    constructor (
        private readonly LlmService : LlmService,
        private readonly DatabaseService : DatabaseService,
        private readonly TransformfileService : TransformfileService,
    ) {}
    @Process('embeddingPDF')
    async handleEmbeddingPDF(job : Job) {
        const {
            file, 
            userID,
            collectionName,
            spaceID,
            fileID,
            size,
            // originalName,
        } = job.data
        
        //insert to database
        await this.DatabaseService.newObject(spaceID,"pdf",fileID,file.originalName,size)
        // parse pdf
        const extract = await this.TransformfileService.PrasePDF(file)
        // update extract content
        await this.DatabaseService.updateObject(spaceID,fileID,{
            extract : extract
        })
        // langchain chunking
        const chunks = await this.LlmService.langchainChunk(extract)
        
        //embedding chunks
        const embedding = await this.LlmService.geminiEmbedding(chunks)
        //store vectors
        await this.LlmService.storeEmbedding(chunks,embedding,userID,collectionName,spaceID,file.originalName)


    }

}