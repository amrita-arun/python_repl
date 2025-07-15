// src/ecs/ecs.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EcsService } from './ecs.service';
import { EcsController } from './ecs.controller';

@Module({
  imports: [ConfigModule],
  providers: [EcsService],
  controllers: [EcsController],
})
export class EcsModule {}