// src/ecs/ecs.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { EcsService } from './ecs.service';

@Controller('ecs')
export class EcsController {
  constructor(private readonly ecs: EcsService) {}

  @Post('run')
  async runTask(@Body('submissionId') submissionId: string) {
    const wsUrl = await this.ecs.startTerminalSession(submissionId);
    return { wsUrl };
  }
}
