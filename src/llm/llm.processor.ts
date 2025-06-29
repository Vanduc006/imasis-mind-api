import { Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { LlmService } from './llm.service';
import { DatabaseService } from 'src/database/database.service';
import { TransformfileService } from 'src/transformfile/transformfile.service';
import { Logger, OnApplicationShutdown } from '@nestjs/common';

@Processor('llmQueue')
export class LLMProcessor implements OnApplicationShutdown {
  private readonly logger = new Logger(LLMProcessor.name);

  constructor(
    private readonly LlmService: LlmService,
    private readonly DatabaseService: DatabaseService,
    private readonly TransformfileService: TransformfileService,
    @InjectQueue('llmQueue') private readonly queue: Queue
  ) {
    this.logger.log('LLMProcessor initialized, Redis connected ✅');
  }

  @Process('embeddingPDF')
  async handleEmbeddingPDF(job: Job) {
    const {
      file,
      userID,
      collectionName,
      spaceID,
      fileID,
      size,
      originalName,
    } = job.data;

    this.logger.log(`➡️ [embeddingPDF] Job ${job.id} started for fileID=${fileID}, spaceID=${spaceID}`);

    try {
      // Step 1: Insert to DB
      await this.DatabaseService.newObject(spaceID, 'pdf', fileID, originalName, size);
      // Loi insert vao database - Done
      this.logger.log(`📦 Object inserted: ${originalName}`);

      // Step 2: Parse PDF
      const extract = await this.TransformfileService.PrasePDF(file);
      this.logger.log(`📄 PDF parsed, ${extract.length} characters`);

      // Step 3: Update extract content
      await this.DatabaseService.updateObject(spaceID, fileID, { extract });
      this.logger.log(`📝 Extract updated in DB`);

      // Step 4: Chunking
      const chunks = await this.LlmService.langchainChunk(extract);
      this.logger.log(`🔪 Text chunked: ${chunks.length} chunks`);

      // Step 5: Embedding
      const embedding = await this.LlmService.geminiEmbedding(chunks);
      this.logger.log(`🧠 Embeddings generated`);

      // Step 6: Store vectors
      await this.LlmService.storeEmbedding(chunks, embedding, userID, collectionName, spaceID, originalName);
      this.logger.log(`📊 Embeddings stored successfully`);
    } catch (error) {
      this.logger.error(`❌ Job ${job.id} failed: ${error.message}`, error.stack);
    }
  }

  async onApplicationShutdown(signal: string) {
    this.logger.warn(`⚠️ App is shutting down (${signal}). Closing Redis...`);
    await this.queue.close(); // ensure connection is closed cleanly
    this.logger.log('✅ Redis connection closed for llmQueue.');
  }

  @Process('embeddingPrompt')
  async handleEmbeddingPrompt(job : Job) {
    const {
      userID,
      collectionName,
      spaceID,
      message,
      model
    } = job.data
    try {
      //Step 1: Granht new ID for message
      const newID = await this.DatabaseService.createID()
      // Step 2: Insert to database
      await this.DatabaseService.newMessage(newID,message,userID,spaceID)
      // Step 3 : Moderation
      const moderation = await this.LlmService.moderationGPT(message)
      // Step 4 : Update moderation and continue or not
      await this.DatabaseService.updateMessage(newID,spaceID,{
        moderation : `${moderation.results[0].flagged}`
      })
      // If true return, if false next step
      if (!moderation.results[0].flagged) {
      // Step 5 : Embedding prompt
        const embedding = await this.LlmService.geminiChunkEmbedding(message)
        await this.LlmService.queryEmbedding(embedding,userID,spaceID,collectionName)
      }
    } catch (error) {
      this.logger.log(`➡️ [embeddingPDF] Job ${job.id}, spaceID=${spaceID}`);
    }
  }

}
