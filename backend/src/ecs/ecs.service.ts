// src/ecs/ecs.service.ts
import {
  ECSClient,
  RunTaskCommand,
  DescribeTasksCommand,
  waitUntilTasksRunning,
  StopTaskCommand,
  UpdateServiceCommand,
  DescribeServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  EC2Client,
  DescribeNetworkInterfacesCommand,
} from '@aws-sdk/client-ec2';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EcsService {
  private readonly ecs: ECSClient;
  private readonly ec2: EC2Client;
  private readonly cluster: string;
  private readonly subnets: string[];
  private readonly securityGroups: string[];
  private readonly taskDef: string;
  private readonly s3Bucket: string;
  private readonly serviceName = 'my-pty-gateway-service-4hjhqqoh';
  private readonly albDns = 'http://terminal-alb-729975150.us-west-2.elb.amazonaws.com:3000/terminal'; // Update if needed

  constructor(private config: ConfigService) {
    const region = this.config.get<string>('AWS_REGION')!;
    this.ecs = new ECSClient({ region });
    this.ec2 = new EC2Client({ region });

    this.cluster        = this.config.get<string>('ECS_CLUSTER')!;
    this.subnets        = this.config.get<string>('SUBNET_IDS')!.split(',');
    this.securityGroups = this.config.get<string>('SEC_GRP_IDS')!.split(',');
    this.taskDef        = this.config.get<string>('TASK_DEF_ARN')!;
    this.s3Bucket       = this.config.get<string>('S3_BUCKET')!;

    console.log('Using ECS Task Definition:', this.taskDef);

  }

  async runSubmissionTask(submissionId: string): Promise<string> {
    // 1) Kick off the Fargate task
    const run = await this.ecs.send(new RunTaskCommand({
      cluster: this.cluster,
      launchType: 'FARGATE',
      taskDefinition: this.taskDef,
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: this.subnets,
          securityGroups: this.securityGroups,
          assignPublicIp: 'ENABLED',
        },
      },
      overrides: {
        containerOverrides: [{
          name: 'my-pty-gateway',
          environment: [
            { name: 'SUBMISSION_ID', value: submissionId },
            { name: 'S3_BUCKET',      value: this.s3Bucket },
          ],
        }],
      },
    }));

    const task = run.tasks?.[0];
    if (!task) {
      throw new InternalServerErrorException('Failed to start ECS task');
    }
    const taskArn = task.taskArn!;

    // 2) Wait until the task is RUNNING
    await waitUntilTasksRunning(
      { client: this.ecs, maxWaitTime: 60 },
      { cluster: this.cluster, tasks: [taskArn] }
    );

    // 3) Describe the task to get the ENI ID
    const desc = await this.ecs.send(new DescribeTasksCommand({
      cluster: this.cluster,
      tasks: [taskArn],
    }));
    const described = desc.tasks?.[0];
    if (!described) {
      throw new InternalServerErrorException('Could not describe ECS task');
    }

    //Extract the ENI ID (try both attachment and container paths)
    // a) Check attachments.details for networkInterfaceId
    let eniId = described.attachments
      ?.flatMap(a => a.details ?? [])
      .find(d => d.name === 'networkInterfaceId')
      ?.value;
    

    if (!eniId) {
      throw new InternalServerErrorException('ENI ID not yet available on task');
    }

    // Describe the ENI to get its private IP
    const ec2Resp = await this.ec2.send(new DescribeNetworkInterfacesCommand({
      NetworkInterfaceIds: [eniId],
    }));
    const privateIp = ec2Resp.NetworkInterfaces?.[0]?.PrivateIpAddress;
    if (!privateIp) {
      throw new InternalServerErrorException('Failed to get ENI IP');
    }

    // Return the WebSocket URL
    return `http://terminal-alb-729975150.us-west-2.elb.amazonaws.com:3000/terminal?submissionId=${submissionId}`;
  }

  async stopSubmissionTask(taskArn: string) {
    await this.ecs.send(new StopTaskCommand({
      cluster: this.cluster,
      task: taskArn,
      reason: 'Session ended',
    }));
  }

  async scaleService(desiredCount: number) {
    await this.ecs.send(new UpdateServiceCommand({
      cluster: this.cluster,
      service: this.serviceName,
      desiredCount,
    }));
  }

  async waitForHealthyTask(timeoutMs = 180000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const desc = await this.ecs.send(new DescribeServicesCommand({
        cluster: this.cluster,
        services: [this.serviceName],
      }));
      const service = desc.services?.[0];
      if (service && service.runningCount && service.runningCount > 0 && service.deployments?.every(d => d.rolloutState === 'COMPLETED')) {
        return;
      }
      await new Promise(res => setTimeout(res, 5000));
    }
    throw new InternalServerErrorException('Timed out waiting for ECS service to become healthy');
  }

  async startTerminalSession(submissionId: string): Promise<string> {
    // Scale up the service
    await this.scaleService(1);
    // Wait for the task to be healthy
    await this.waitForHealthyTask();
    // Schedule scale down after 10 minutes
    setTimeout(() => {
      this.scaleService(0).catch(err => console.error('Failed to scale down ECS service:', err));
    }, 10 * 60 * 1000);
    // Return the ALB DNS for socket.io connection
    return `${this.albDns}?submissionId=${submissionId}`;
  }
}
