import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // enables CORS so we can communicate w/ frontend
  //app.useWebSocketAdapter(new IoAdapter(app))
  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT, '0.0.0.0');
  console.log(`Backend is running on http://0.0.0.0:${PORT}`);
}
bootstrap();
