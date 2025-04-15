import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadController } from './upload/upload.controller';
import { ParamsController } from './params/params.controller';
import { ParamsModule } from './params/params.module';
import { TransformfileService } from './transformfile/transformfile.service';
import { UploadService } from './upload/upload.service';

@Module({
  imports: [ParamsModule],
  controllers: [AppController, UploadController, ParamsController],
  providers: [AppService, TransformfileService, UploadService],
})
export class AppModule {}
