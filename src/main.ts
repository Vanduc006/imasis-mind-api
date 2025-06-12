import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://cuddly-chainsaw-q59gwg69w57h9w47-5173.app.github.dev',
      'https://imasis.id.vn',
      'https://glorious-meme-wpqg9v4x4662www-5173.app.github.dev',
      'http://127.0.0.1',
      'http://localhost',
      // 'http://127.0.0.1:5173',
      // 'http://localhost:5173',
    ],
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
