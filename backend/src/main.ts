import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // enables CORS so we can communicate w/ frontend
  app.useWebSocketAdapter(new IoAdapter(app))
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
