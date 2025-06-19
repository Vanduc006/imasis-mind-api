import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadController } from './upload/upload.controller';
import { ParamsController } from './params/params.controller';
import { ParamsModule } from './params/params.module';
import { TransformfileService } from './transformfile/transformfile.service';
import { UploadService } from './upload/upload.service';
import { LlmService } from './llm/llm.service';
import { LlmController } from './llm/llm.controller';
import { DatabaseService } from './database/database.service';
import { UploadModule } from './upload/upload.module';
import { LlmModule } from './llm/llm.module';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ParamsModule, UploadModule, LlmModule

  ],
  controllers: [AppController, UploadController, ParamsController, LlmController],
  providers: [AppService, TransformfileService,DatabaseService],
})
export class AppModule {}
