import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LLMProcessor } from './llm.processor';
import { DatabaseService } from 'src/database/database.service';
import { TransformfileService } from 'src/transformfile/transformfile.service';

@Module({
    imports : [BullModule.registerQueue({name:'llmQueue'})],
    providers : [LlmService,LLMProcessor,DatabaseService,TransformfileService],
    exports : [LlmService],
})
export class LlmModule {}
