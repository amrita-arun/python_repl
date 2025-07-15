import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TerminalModule } from './terminal/terminal.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { ConfigModule } from '@nestjs/config';
import { EcsModule } from './ecs/ecs.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminalModule, SubmissionsModule, ConfigModule.forRoot({ isGlobal: true }), EcsModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
