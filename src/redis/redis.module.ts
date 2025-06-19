import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

@Module({
    imports : [
        BullModule.forRoot({
            redis: {
            host: 'alive-feline-50760.upstash.io',
            port: 6379,
            password: 'AcZIAAIjcDEzY2Q4YWZjNDExZmE0NzhmODNkMjUyYmY2M2ExYWJjZXAxMA',
            tls: {}, // ⚠️ bắt buộc khi dùng Upstash (SSL)
            },
        }),
    ]
})
export class RedisModule {}
