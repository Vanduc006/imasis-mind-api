import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadProcessor } from './upload.processor';
import { UploadController } from './upload.controller';
import { LlmModule } from 'src/llm/llm.module';
import { ENV } from 'config/env';
@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'alive-feline-50760.upstash.io',
        port: 6379,
        password: ENV.REDIS_KEY,
        tls: {}, // ⚠️ bắt buộc khi dùng Upstash (SSL)
      },
    }),
    BullModule.registerQueue({
      name: 'uploadQueue', // ✅ TÊN CHÍNH XÁC
    }),
    LlmModule,
  ],
  providers: [UploadService, UploadProcessor],
  exports: [UploadService], // ✅ nếu cần dùng ở AppModule hoặc nơi khác
})
export class UploadModule {}

