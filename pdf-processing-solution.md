# PDF Processing Solution

## 1. Vấn đề hiện tại
- Xử lý PDF tuần tự (one by one)
- Không có cơ chế cache
- Không có queue system
- Không có progress tracking hiệu quả
- Không có retry mechanism
- Không có parallel processing

## 2. Giải pháp tổng thể

### 2.1. Queue System với Bull
```typescript
// queue.service.ts
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { ENV } from 'config/env';

@Injectable()
export class QueueService {
    private readonly pdfQueue: Queue;

    constructor() {
        this.pdfQueue = new Queue('pdf-processing', {
            redis: {
                host: ENV.REDIS_HOST,
                port: ENV.REDIS_PORT
            }
        });

        this.setupQueueProcessor();
    }

    private setupQueueProcessor() {
        this.pdfQueue.process(async (job) => {
            const { file, userID, collectionName, spaceID, fileID } = job.data;
            
            // Update progress
            await job.progress(10);
            const extract = await this.TransformfileService.PrasePDF(file);
            
            await job.progress(30);
            const chunks = await this.LlmService.langchainChunk(extract);
            
            await job.progress(50);
            const embedding = await this.LlmService.geminiEmbedding(chunks);
            
            await job.progress(70);
            const storeVector = await this.LlmService.storeEmbedding(
                chunks, 
                embedding, 
                userID, 
                collectionName, 
                spaceID, 
                file.originalname
            );

            await job.progress(100);
            return { extract, embedding, chunks, storeVector };
        });
    }

    async addPdfJob(data: any) {
        return this.pdfQueue.add('process-pdf', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000
            }
        });
    }
}
```

### 2.2. Controller mới
```typescript
// llm.controller.ts
@Controller('llm')
export class LlmController {
    constructor(
        private readonly queueService: QueueService,
        private readonly progressService: ProgressService
    ) {}

    @Post('embeddingPDF')
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
    async createEmbedding(
        @UploadedFile() file: Express.Multer.File,
        @Query('userID') userID: string,
        @Query('collectionName') collectionName: string,
        @Query('spaceID') spaceID: string,
        @Query('fileID') fileID: string
    ) {
        const job = await this.queueService.addPdfJob({
            file,
            userID,
            collectionName,
            spaceID,
            fileID
        });

        return {
            jobId: job.id,
            status: 'processing'
        };
    }

    @Get('embedding-status/:jobId')
    async getEmbeddingStatus(@Param('jobId') jobId: string) {
        const job = await this.queueService.pdfQueue.getJob(jobId);
        if (!job) {
            throw new NotFoundException('Job not found');
        }

        const state = await job.getState();
        const progress = job.progress;
        
        return {
            jobId,
            state,
            progress,
            result: job.returnvalue
        };
    }
}
```

### 2.3. Progress Tracking Service
```typescript
// progress.service.ts
@Injectable()
export class ProgressService {
    private readonly progressMap: Map<string, any>;

    constructor() {
        this.progressMap = new Map();
    }

    updateProgress(jobId: string, progress: number, stage: string) {
        this.progressMap.set(jobId, {
            progress,
            stage,
            timestamp: Date.now()
        });
    }

    getProgress(jobId: string) {
        return this.progressMap.get(jobId);
    }
}
```

### 2.4. Cache Service
```typescript
// cache.service.ts
@Injectable()
export class CacheService {
    private readonly cache: Map<string, any>;
    private readonly ttl: number = 3600; // 1 hour

    constructor() {
        this.cache = new Map();
    }

    async get(key: string) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    async set(key: string, value: any) {
        this.cache.set(key, {
            value,
            expiry: Date.now() + this.ttl * 1000
        });
    }
}
```

## 3. Cài đặt và Cấu hình

### 3.1. Dependencies
```bash
npm install bull @types/bull
```

### 3.2. Environment Variables
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3.3. Module Configuration
```typescript
// app.module.ts
@Module({
    imports: [
        BullModule.forRoot({
            redis: {
                host: ENV.REDIS_HOST,
                port: ENV.REDIS_PORT
            }
        }),
        BullModule.registerQueue({
            name: 'pdf-processing'
        })
    ],
    providers: [
        QueueService,
        ProgressService,
        CacheService
    ]
})
export class AppModule {}
```

## 4. Lợi ích

### 4.1. Performance
- Xử lý song song nhiều PDF
- Tự động retry khi có lỗi
- Rate limiting để tránh quá tải
- Caching để tối ưu performance

### 4.2. Monitoring
- Theo dõi tiến trình xử lý realtime
- Log lỗi chi tiết
- Metrics về performance
- Job status tracking

### 4.3. Scalability
- Dễ dàng scale horizontally
- Có thể thêm nhiều worker
- Job priority system
- Resource management

## 5. Sử dụng

### 5.1. Upload PDF
```typescript
// Client side
const response = await axios.post('/llm/embeddingPDF', formData, {
    params: {
        userID: 'user123',
        collectionName: 'docs',
        spaceID: 'space123',
        fileID: 'file123'
    }
});

const { jobId } = response.data;
```

### 5.2. Check Status
```typescript
// Client side
const status = await axios.get(`/llm/embedding-status/${jobId}`);
console.log(status.data);
// {
//     jobId: '123',
//     state: 'completed',
//     progress: 100,
//     result: { ... }
// }
```

## 6. Monitoring và Debugging

### 6.1. Bull Board
```typescript
// app.module.ts
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
createBullBoard({
    queues: [new BullAdapter(pdfQueue)],
    serverAdapter
});

serverAdapter.setBasePath('/admin/queues');
app.use('/admin/queues', serverAdapter.getRouter());
```

### 6.2. Logging
```typescript
// queue.service.ts
this.pdfQueue.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
});

this.pdfQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err);
});
```

## 7. Best Practices

1. **Error Handling**
   - Implement retry mechanism
   - Log errors properly
   - Handle edge cases

2. **Resource Management**
   - Set appropriate concurrency limits
   - Monitor memory usage
   - Clean up completed jobs

3. **Security**
   - Validate input files
   - Implement rate limiting
   - Secure Redis connection

4. **Performance**
   - Use appropriate chunk sizes
   - Implement caching
   - Monitor queue length

## 8. Next Steps

1. Implement monitoring dashboard
2. Add more sophisticated error handling
3. Implement file validation
4. Add cleanup jobs
5. Implement rate limiting
6. Add metrics collection 