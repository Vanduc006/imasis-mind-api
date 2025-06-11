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

@Module({
  imports: [ParamsModule],
  controllers: [AppController, UploadController, ParamsController, LlmController],
  providers: [AppService, TransformfileService, UploadService, LlmService, DatabaseService],
})
export class AppModule {}
